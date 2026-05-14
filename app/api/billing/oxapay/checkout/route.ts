import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  getSupabaseServer,
  getSupabaseServiceRole,
} from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { PAYG } from "@/lib/billing/plans";
import { createInvoice } from "@/lib/billing/oxapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  quantity: z.number().int().min(1).max(20).optional(),
});

function resolveSiteUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  // Fall back to the request origin so dev (http://localhost:3000) still works
  // without setting NEXT_PUBLIC_SITE_URL.
  return req.nextUrl.origin;
}

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

  const quantity = payload.quantity ?? 1;
  const amount_cents = PAYG.price_cents * quantity;
  const amount_decimal = amount_cents / 100;
  const orderId = randomUUID();

  const siteUrl = resolveSiteUrl(req);

  // Pre-insert a pending payment row so the verify endpoint can answer
  // meaningfully before OxaPay's webhook fires. We key it on the raw.order_id
  // we generated; oxapay_track_id is stamped once OxaPay echoes it.
  const svc = getSupabaseServiceRole();
  const { error: insertErr } = await svc.from("payments").insert({
    user_id: user.id,
    revolut_order_id: null,
    kind: "one_off",
    plan: null,
    amount_cents,
    currency: "USD",
    provider: "oxapay",
    status: "pending",
    raw: { order_id: orderId, quantity } as Json,
  });
  if (insertErr) {
    return NextResponse.json(
      { error: "audit_insert_failed", detail: insertErr.message },
      { status: 500 },
    );
  }

  let invoice: Awaited<ReturnType<typeof createInvoice>>;
  try {
    invoice = await createInvoice({
      amount: amount_decimal,
      currency: "USD",
      orderId,
      callbackUrl: `${siteUrl}/api/billing/oxapay/webhook`,
      returnUrl: `${siteUrl}/checkout/success?provider=oxapay&order_id=${orderId}&quantity=${quantity}`,
      description: `${quantity} contract credit${quantity === 1 ? "" : "s"} — Green Flagged`,
      email: user.email,
      lifetimeMinutes: 60,
    });
  } catch (err) {
    // Surface a clean error to the caller. Leave the pending row in place so
    // the verify endpoint can flip to failed in due course (it won't, since
    // there's no track_id; the row will simply remain pending and the user
    // can retry).
    return NextResponse.json(
      { error: "oxapay_create_failed", detail: (err as Error).message },
      { status: 502 },
    );
  }

  // Stamp the row with the track_id so the webhook can find it later.
  await svc
    .from("payments")
    .update({ oxapay_track_id: invoice.track_id })
    .eq("user_id", user.id)
    .eq("provider", "oxapay")
    .filter("raw->>order_id", "eq", orderId);

  return NextResponse.json({
    order_id: orderId,
    track_id: invoice.track_id,
    payment_url: invoice.payment_url,
    expired_at: invoice.expired_at,
  });
}
