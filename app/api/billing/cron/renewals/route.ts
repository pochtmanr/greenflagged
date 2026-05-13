import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabaseServiceRole } from "@/lib/supabase/server";
import type { Json, PlanId } from "@/lib/supabase/types";
import { PLANS } from "@/lib/billing/plans";
import { chargeSavedCard, RevolutApiError } from "@/lib/billing/revolut";
import { getLeadTo, getMailFrom, getResend } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel cron handler — `vercel.json` schedules a daily GET at this path.
// External callers must present CRON_SECRET via the standard `Authorization:
// Bearer …` header (Vercel sends this automatically when crons.secret is set).
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "cron_disabled", detail: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const service = await getSupabaseServiceRole();
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // next 24h

  // Two phases: (a) flip cancel_at_period_end subs to canceled once expired,
  // (b) renew everything else that's about to end.
  const expiredCancellations = await service
    .from("subscriptions")
    .update({ status: "canceled", updated_at: now.toISOString() })
    .eq("cancel_at_period_end", true)
    .lt("current_period_end", now.toISOString())
    .neq("status", "canceled")
    .select("user_id");

  const { data: dueRows, error: dueErr } = await service
    .from("subscriptions")
    .select(
      "user_id, plan, current_period_end, revolut_customer_id, revolut_payment_method_id",
    )
    .eq("status", "active")
    .eq("cancel_at_period_end", false)
    .neq("plan", "free")
    .lte("current_period_end", horizon.toISOString());
  if (dueErr) {
    return NextResponse.json(
      { error: "query_failed", detail: dueErr.message },
      { status: 500 },
    );
  }

  const results: Array<{
    user_id: string;
    plan: PlanId;
    status: "renewed" | "missing_card" | "failed";
    detail?: string;
  }> = [];

  for (const row of dueRows ?? []) {
    const planId = row.plan as PlanId;
    const plan = PLANS[planId];
    if (!plan || planId === "free") continue;
    if (!row.revolut_customer_id || !row.revolut_payment_method_id) {
      results.push({
        user_id: row.user_id,
        plan: planId,
        status: "missing_card",
      });
      continue;
    }

    const idempotency_key = `renew:${row.user_id}:${row.current_period_end ?? "init"}`;
    const orderId = randomUUID();

    // Insert pending payment row first — webhook for the charge will flip it
    // to succeeded. If the charge call throws synchronously, we mark failed
    // here.
    const { data: paymentRow, error: payInsertErr } = await service
      .from("payments")
      .insert({
        user_id: row.user_id,
        revolut_order_id: null,
        kind: "subscription_renewal",
        plan: planId,
        amount_cents: plan.price_cents,
        currency: plan.currency,
        status: "pending",
        raw: { idempotency_key, scheduled_order_id: orderId } as Json,
      })
      .select("id")
      .single();
    if (payInsertErr || !paymentRow) {
      results.push({
        user_id: row.user_id,
        plan: planId,
        status: "failed",
        detail: payInsertErr?.message ?? "insert_failed",
      });
      continue;
    }

    try {
      const { order } = await chargeSavedCard({
        customer_id: row.revolut_customer_id,
        payment_method_id: row.revolut_payment_method_id,
        amount_cents: plan.price_cents,
        currency: plan.currency,
        description: `Green Flagged ${plan.label} renewal`,
        idempotency_key,
        metadata: { user_id: row.user_id, plan: planId },
      });
      await service
        .from("payments")
        .update({ revolut_order_id: order.id })
        .eq("id", paymentRow.id);
      results.push({ user_id: row.user_id, plan: planId, status: "renewed" });
    } catch (err) {
      const detail =
        err instanceof RevolutApiError
          ? `${err.status} ${err.bodyText.slice(0, 200)}`
          : (err as Error).message;
      await service
        .from("payments")
        .update({
          status: "failed",
          raw: { idempotency_key, error: detail } as Json,
        })
        .eq("id", paymentRow.id);
      await service
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("user_id", row.user_id);
      results.push({
        user_id: row.user_id,
        plan: planId,
        status: "failed",
        detail,
      });
      // Best-effort ops alert; don't crash the cron if Resend fails.
      try {
        const resend = getResend();
        await resend.emails.send({
          from: getMailFrom(),
          to: getLeadTo(),
          subject: `[Green Flagged] Renewal failed — ${row.user_id}`,
          html: `<p>Subscription renewal failed for user <code>${row.user_id}</code> on plan <strong>${planId}</strong>.</p><p>${detail}</p>`,
        });
      } catch {
        // ignore — already logged in payments.raw
      }
    }
  }

  return NextResponse.json({
    ok: true,
    expired_cancellations: (expiredCancellations.data ?? []).length,
    attempted: results.length,
    results,
  });
}
