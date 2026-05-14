import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  getSupabaseServer,
  getSupabaseServiceRole,
} from "@/lib/supabase/server";
import type { Json, PlanId } from "@/lib/supabase/types";
import { PAYG, PLANS } from "@/lib/billing/plans";
import { createOrder } from "@/lib/billing/revolut";

export const runtime = "nodejs";
// Webhook & checkout routes must run per-request — they touch user auth and
// external APIs.
export const dynamic = "force-dynamic";

const PLAN_IDS = ["standard"] as const satisfies readonly PlanId[];

const Body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("subscription"),
    plan: z.enum(PLAN_IDS),
  }),
  z.object({
    kind: z.literal("payg"),
    quantity: z.number().int().min(1).max(20).optional(),
  }),
]);

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!user.email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "invalid_body", detail: (err as Error).message },
      { status: 400 },
    );
  }

  const planId: PlanId | null =
    payload.kind === "subscription" ? payload.plan : null;
  const quantity =
    payload.kind === "payg" ? (payload.quantity ?? 1) : 1;
  const isSubscription = payload.kind === "subscription";

  const amount_cents = planId
    ? PLANS[planId].price_cents
    : PAYG.price_cents * quantity;
  const currency: "USD" = planId ? PLANS[planId].currency : PAYG.currency;
  const description = planId
    ? `Green Flagged ${PLANS[planId].label} (${PLANS[planId].interval})`
    : `${quantity} contract credit${quantity === 1 ? "" : "s"} — Green Flagged`;

  const origin = req.nextUrl.origin;
  const redirect_url = `${origin}/settings/billing?from=checkout`;

  // Create the Revolut order. `save_payment_method_for_merchant` is true for
  // both subscriptions (renewals) and PAYG (so the same saved card can later
  // cover Standard overages — prompt12 wires the MIT charge).
  let order;
  try {
    order = await createOrder({
      amount_cents,
      currency,
      description,
      customer_email: user.email,
      redirect_url,
      save_payment_method_for_merchant: true,
      metadata: {
        user_id: user.id,
        kind: isSubscription ? "subscription_initial" : "one_off",
        plan: planId ?? "",
        quantity: String(quantity),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "revolut_create_failed", detail: (err as Error).message },
      { status: 502 },
    );
  }

  // Audit row — webhook will flip the status to succeeded on ORDER_COMPLETED.
  const service = getSupabaseServiceRole();
  const { error: insertErr } = await service.from("payments").insert({
    user_id: user.id,
    revolut_order_id: order.id,
    kind: isSubscription ? "subscription_initial" : "one_off",
    plan: planId,
    amount_cents,
    currency,
    status: "pending",
    provider: "revolut",
    raw: { order: order as unknown, quantity } as Json,
  });
  if (insertErr) {
    return NextResponse.json(
      { error: "audit_insert_failed", detail: insertErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    checkout_url: order.checkout_url,
    order_id: order.id,
  });
}
