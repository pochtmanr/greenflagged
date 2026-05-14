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
        provider: "revolut",
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

  // ===== Past-due retry sweep =====
  // For subscriptions stuck in `past_due`:
  //   - Up to 3 daily MIT retries. Each retry inserts a pending payment row
  //     and calls chargeSavedCard; the webhook flips status → active on
  //     ORDER_COMPLETED. Failures keep status at past_due.
  //   - Gate retries by subscriptions.updated_at (>= 23h since the last
  //     attempt) so a single daily cron run never double-charges.
  //   - After 3 failed retry attempts (counted against created_at < 7 days)
  //     OR after 3 days since the renewal period ended, flip → expired and
  //     let getQuota() fall back to free.
  const oneDayAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
  const retryWindowStart = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const MAX_RETRY_ATTEMPTS = 3;

  const { data: pastDueRows, error: pastDueErr } = await service
    .from("subscriptions")
    .select(
      "user_id, plan, current_period_end, updated_at, revolut_customer_id, revolut_payment_method_id",
    )
    .eq("status", "past_due")
    .neq("plan", "free");
  if (pastDueErr) {
    return NextResponse.json(
      { error: "past_due_query_failed", detail: pastDueErr.message },
      { status: 500 },
    );
  }

  const pastDueResults: Array<{
    user_id: string;
    plan: PlanId;
    outcome:
      | "retry_attempted"
      | "retry_failed"
      | "expired"
      | "skipped_recent"
      | "missing_card"
      | "insert_failed";
    detail?: string;
  }> = [];

  for (const row of pastDueRows ?? []) {
    const planId = row.plan as PlanId;
    const plan = PLANS[planId];
    if (!plan || planId === "free") continue;

    const updatedAt = new Date(row.updated_at);
    const periodEnd = row.current_period_end
      ? new Date(row.current_period_end)
      : null;

    // Count recent failed renewal attempts for this user.
    const { count: failedAttempts } = await service
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", row.user_id)
      .eq("kind", "subscription_renewal")
      .eq("status", "failed")
      .gte("created_at", retryWindowStart);

    const expiredByPeriod =
      periodEnd !== null &&
      now.getTime() - periodEnd.getTime() >= 3 * 24 * 60 * 60 * 1000;

    if ((failedAttempts ?? 0) >= MAX_RETRY_ATTEMPTS || expiredByPeriod) {
      await service
        .from("subscriptions")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("user_id", row.user_id);
      pastDueResults.push({
        user_id: row.user_id,
        plan: planId,
        outcome: "expired",
        detail: `attempts=${failedAttempts ?? 0} expired_by_period=${expiredByPeriod}`,
      });
      continue;
    }

    // One attempt per ~day.
    if (updatedAt > oneDayAgo) {
      pastDueResults.push({
        user_id: row.user_id,
        plan: planId,
        outcome: "skipped_recent",
      });
      continue;
    }

    if (!row.revolut_customer_id || !row.revolut_payment_method_id) {
      pastDueResults.push({
        user_id: row.user_id,
        plan: planId,
        outcome: "missing_card",
      });
      continue;
    }

    const retry_idempotency_key = `retry:${row.user_id}:${updatedAt.toISOString()}`;

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
        provider: "revolut",
        raw: { idempotency_key: retry_idempotency_key, retry: true } as Json,
      })
      .select("id")
      .single();
    if (payInsertErr || !paymentRow) {
      pastDueResults.push({
        user_id: row.user_id,
        plan: planId,
        outcome: "insert_failed",
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
        description: `Green Flagged ${plan.label} retry`,
        idempotency_key: retry_idempotency_key,
        metadata: { user_id: row.user_id, plan: planId, retry: "true" },
      });
      await service
        .from("payments")
        .update({ revolut_order_id: order.id })
        .eq("id", paymentRow.id);
      // Touch updated_at so the next sweep waits another ~day. Webhook will
      // flip status → active on terminal success.
      await service
        .from("subscriptions")
        .update({ updated_at: now.toISOString() })
        .eq("user_id", row.user_id);
      pastDueResults.push({
        user_id: row.user_id,
        plan: planId,
        outcome: "retry_attempted",
      });
    } catch (err) {
      const detail =
        err instanceof RevolutApiError
          ? `${err.status} ${err.bodyText.slice(0, 200)}`
          : (err as Error).message;
      await service
        .from("payments")
        .update({
          status: "failed",
          raw: { idempotency_key: retry_idempotency_key, error: detail } as Json,
        })
        .eq("id", paymentRow.id);
      await service
        .from("subscriptions")
        .update({ updated_at: now.toISOString() })
        .eq("user_id", row.user_id);
      pastDueResults.push({
        user_id: row.user_id,
        plan: planId,
        outcome: "retry_failed",
        detail,
      });
      try {
        const resend = getResend();
        await resend.emails.send({
          from: getMailFrom(),
          to: getLeadTo(),
          subject: `[Green Flagged] past_due retry failed — ${row.user_id}`,
          html: `<p>Daily MIT retry failed for <code>${row.user_id}</code> on plan <strong>${planId}</strong>.</p><p>Attempts in window: ${(failedAttempts ?? 0) + 1}/${MAX_RETRY_ATTEMPTS}.</p><p>${detail}</p>`,
        });
      } catch {
        // ignore — already in payments.raw
      }
    }
  }

  return NextResponse.json({
    ok: true,
    expired_cancellations: (expiredCancellations.data ?? []).length,
    attempted: results.length,
    results,
    past_due: pastDueResults,
  });
}
