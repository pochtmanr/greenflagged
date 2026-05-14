import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase/server";
import type { Json, PlanId } from "@/lib/supabase/types";
import { PAYG, PLANS, periodLengthDays } from "@/lib/billing/plans";
import { retrieveOrder, verifyWebhookSignature } from "@/lib/billing/revolut";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevolutEvent = {
  event: string;
  order_id?: string;
  merchant_order_ext_ref?: string;
};

function addInterval(from: Date, planId: PlanId): Date {
  const days = periodLengthDays(PLANS[planId].interval);
  const out = new Date(from.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export async function POST(req: NextRequest) {
  // Read raw body once for signature verification AND parsing — re-reading
  // would alter byte content and break the signature.
  const rawBody = await req.text();
  const sigCheck = verifyWebhookSignature({
    rawBody,
    signatureHeader: req.headers.get("revolut-signature"),
    timestampHeader: req.headers.get("revolut-request-timestamp"),
  });
  if (!sigCheck.ok) {
    return NextResponse.json(
      { error: "signature_verification_failed", reason: sigCheck.reason },
      { status: 400 },
    );
  }

  let event: RevolutEvent;
  try {
    event = JSON.parse(rawBody) as RevolutEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!event.order_id) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  const service = await getSupabaseServiceRole();

  // Look up the pending payment row we created at checkout time.
  const { data: payment } = await service
    .from("payments")
    .select("id, user_id, kind, plan, amount_cents, currency, raw")
    .eq("revolut_order_id", event.order_id)
    .maybeSingle();
  if (!payment) {
    // We didn't record this order. Likely a foreign webhook or replay from
    // a prior environment. Acknowledge so Revolut stops retrying.
    return NextResponse.json({ ignored: true, reason: "unknown_order" });
  }

  // Fetch the full order from Revolut — webhook bodies are minimal, but for
  // subscription_initial we need the saved customer_id + payment_method_id.
  let revolutOrder: Awaited<ReturnType<typeof retrieveOrder>>;
  try {
    revolutOrder = await retrieveOrder(event.order_id);
  } catch (err) {
    return NextResponse.json(
      { error: "revolut_fetch_failed", detail: (err as Error).message },
      { status: 502 },
    );
  }

  const isSuccess =
    event.event === "ORDER_COMPLETED" || event.event === "ORDER_AUTHORISED";
  const isFailure =
    event.event === "ORDER_FAILED" ||
    event.event === "ORDER_PAYMENT_FAILED" ||
    event.event === "ORDER_PAYMENT_DECLINED" ||
    event.event === "ORDER_CANCELLED";

  if (isSuccess) {
    await service
      .from("payments")
      .update({
        status: "succeeded",
        raw: {
          event: event as unknown,
          order: revolutOrder as unknown,
        } as Json,
      })
      .eq("id", payment.id);

    if (payment.kind === "one_off") {
      // PAYG: `one_off` is the legacy metadata kind we kept on the Revolut
      // side. Treat it as a PAYG credit purchase — N contract credits valid
      // for PAYG.ttl_days (default 90). Quantity rides in raw.quantity (set
      // at checkout time) and falls back to 1 for older orders.
      const rawObj =
        payment.raw && typeof payment.raw === "object"
          ? (payment.raw as Record<string, unknown>)
          : null;
      const rawQty =
        rawObj && typeof rawObj.quantity === "number"
          ? rawObj.quantity
          : rawObj && typeof rawObj.quantity === "string"
            ? Number.parseInt(rawObj.quantity, 10)
            : NaN;
      const quantity = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
      const expiresAt = new Date(
        Date.now() + PAYG.ttl_days * 24 * 60 * 60 * 1000,
      ).toISOString();
      await service.from("credits").insert({
        user_id: payment.user_id,
        contracts_remaining: PAYG.contracts * quantity,
        expires_at: expiresAt,
        source: PAYG.source,
      });
    } else if (
      payment.kind === "subscription_initial" ||
      payment.kind === "subscription_renewal"
    ) {
      const planId = (payment.plan as PlanId | null) ?? null;
      if (planId && planId !== "free") {
        const now = new Date();
        const periodEnd = addInterval(now, planId);
        await service.from("subscriptions").upsert(
          {
            user_id: payment.user_id,
            plan: planId,
            status: "active",
            revolut_customer_id: revolutOrder.customer_id ?? null,
            revolut_payment_method_id:
              revolutOrder.payment_method_id ?? null,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
            updated_at: now.toISOString(),
          },
          { onConflict: "user_id" },
        );
      }
    }
  } else if (isFailure) {
    await service
      .from("payments")
      .update({
        status: "failed",
        raw: {
          event: event as unknown,
          order: revolutOrder as unknown,
        } as Json,
      })
      .eq("id", payment.id);

    if (
      payment.kind === "subscription_initial" ||
      payment.kind === "subscription_renewal"
    ) {
      await service
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", payment.user_id);
    }
  }

  return NextResponse.json({ ok: true });
}
