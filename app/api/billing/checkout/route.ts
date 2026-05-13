import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  getSupabaseServer,
  getSupabaseServiceRole,
} from "@/lib/supabase/server";
import type { Json, PlanId } from "@/lib/supabase/types";
import { ONE_OFF, PLANS } from "@/lib/billing/plans";
import { createOrder } from "@/lib/billing/revolut";

export const runtime = "nodejs";
// Webhook & checkout routes must run per-request — they touch user auth and
// external APIs.
export const dynamic = "force-dynamic";

const PLAN_IDS = [
  "freelancer_monthly",
  "freelancer_yearly",
  "pro_monthly",
  "pro_yearly",
] as const satisfies readonly PlanId[];

const Body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("subscription"),
    plan: z.enum(PLAN_IDS),
  }),
  z.object({ kind: z.literal("one_off") }),
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

  const isSubscription = payload.kind === "subscription";
  const planId: PlanId | null =
    payload.kind === "subscription" ? payload.plan : null;

  const amount_cents = planId
    ? PLANS[planId].price_cents
    : ONE_OFF.price_cents;
  const currency = planId ? PLANS[planId].currency : ONE_OFF.currency;
  const description = planId
    ? `Green Flagged ${PLANS[planId].label} (${PLANS[planId].interval})`
    : `Green Flagged ${ONE_OFF.label}`;

  const origin = req.nextUrl.origin;
  const redirect_url = `${origin}/settings/billing?from=checkout`;

  // Create the Revolut order. `save_payment_method_for_merchant` is only
  // requested for subscriptions, so renewals can re-charge off-session.
  const order = await createOrder({
    amount_cents,
    currency,
    description,
    customer_email: user.email,
    redirect_url,
    save_payment_method_for_merchant: isSubscription,
    metadata: {
      user_id: user.id,
      kind: isSubscription ? "subscription_initial" : "one_off",
      plan: planId ?? "",
    },
  });

  // Audit row — webhook will flip the status to succeeded on ORDER_COMPLETED.
  const service = await getSupabaseServiceRole();
  const { error: insertErr } = await service.from("payments").insert({
    user_id: user.id,
    revolut_order_id: order.id,
    kind: isSubscription ? "subscription_initial" : "one_off",
    plan: planId,
    amount_cents,
    currency,
    status: "pending",
    raw: { order: order as unknown } as Json,
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
