import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSupabaseServiceRole } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// RevenueCat v1 webhook event shapes — typed only for the fields we touch.
// Full reference: https://docs.revenuecat.com/docs/webhooks
type RCEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "PRODUCT_CHANGE"
  | "TRANSFER"
  | "CANCELLATION"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "NON_RENEWING_PURCHASE"
  | "SUBSCRIBER_ALIAS"
  | "UNCANCELLATION"
  | "TEST";

type RCEvent = {
  type: RCEventType;
  id?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  environment?: "SANDBOX" | "PRODUCTION";
  store?: "APP_STORE" | "PLAY_STORE" | string;
};

type RCWebhookBody = {
  api_version?: string;
  event: RCEvent;
};

function bearerOk(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const presented = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  if (presented.length !== expected.length) return false;
  return timingSafeEqual(presented, expected);
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 500 },
    );
  }
  if (!bearerOk(req.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: RCWebhookBody;
  try {
    body = (await req.json()) as RCWebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ev = body.event;
  if (!ev?.type) {
    return NextResponse.json({ error: "missing_event_type" }, { status: 400 });
  }

  // Test events from the RC dashboard fire without a user — ack and exit.
  if (ev.type === "TEST") {
    return NextResponse.json({ ok: true, test: true });
  }

  // Only Apple is wired through this webhook for now. Play store / Stripe
  // events arrive here too in some RC project configurations — ack and skip.
  if (ev.store && ev.store !== "APP_STORE") {
    return NextResponse.json({ ok: true, skipped: "non_apple_store" });
  }

  const userId = ev.app_user_id;
  if (!userId) {
    return NextResponse.json({ error: "missing_app_user_id" }, { status: 400 });
  }

  const service = getSupabaseServiceRole();

  // Confirm the user exists. Anonymous RC ids (e.g. "$RCAnonymousID:…") arrive
  // before the client has called logIn — those events are noise; ack and skip.
  if (userId.startsWith("$RCAnonymousID")) {
    return NextResponse.json({ ok: true, skipped: "anonymous" });
  }
  const { data: userRow } = await service
    .from("subscriptions")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  // No-op if the user has never had a subscription row — still try to write
  // because INITIAL_PURCHASE creates the row. The `auth.users` FK on
  // `subscriptions.user_id` will reject genuinely unknown users.
  void userRow;

  const txId = ev.transaction_id ?? ev.original_transaction_id ?? null;
  const originalTxId = ev.original_transaction_id ?? txId;
  const productId = ev.product_id ?? null;
  const purchasedAt = ev.purchased_at_ms
    ? new Date(ev.purchased_at_ms).toISOString()
    : new Date().toISOString();
  const expiresAt = ev.expiration_at_ms
    ? new Date(ev.expiration_at_ms).toISOString()
    : null;

  // Idempotency: per-event payment row keyed on apple_transaction_id. The
  // unique index makes the duplicate insert fail; we treat that as dedup.
  if (txId) {
    const { data: existing } = await service
      .from("payments")
      .select("id")
      .eq("apple_transaction_id", txId)
      .maybeSingle();
    if (existing) {
      // Still apply subscription updates that are safe to re-run on the same
      // transaction (e.g. RC re-sends RENEWAL). Status flips below are
      // idempotent.
      if (
        ev.type !== "CANCELLATION" &&
        ev.type !== "EXPIRATION" &&
        ev.type !== "BILLING_ISSUE" &&
        ev.type !== "UNCANCELLATION"
      ) {
        return NextResponse.json({ ok: true, dedup: true });
      }
    }
  }

  const rawJson = body as unknown as Json;

  switch (ev.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "PRODUCT_CHANGE":
    case "TRANSFER": {
      if (!originalTxId || !expiresAt) break;
      await service.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "standard",
          status: "active",
          provider: "apple",
          apple_original_transaction_id: originalTxId,
          apple_product_id: productId,
          current_period_start: purchasedAt,
          current_period_end: expiresAt,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (txId) {
        await service.from("payments").insert({
          user_id: userId,
          apple_transaction_id: txId,
          provider: "apple",
          kind:
            ev.type === "INITIAL_PURCHASE"
              ? "subscription_initial"
              : "subscription_renewal",
          plan: "standard",
          amount_cents: 0,
          currency: "USD",
          status: "succeeded",
          raw: rawJson,
        });
      }
      break;
    }

    case "UNCANCELLATION": {
      // User re-subscribed before period_end. Clear the pending-cancel flag.
      await service
        .from("subscriptions")
        .update({
          cancel_at_period_end: false,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "apple");
      break;
    }

    case "CANCELLATION": {
      // User cancelled future renewals. Keep access until period_end.
      await service
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "apple");
      break;
    }

    case "EXPIRATION": {
      await service
        .from("subscriptions")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "apple");
      break;
    }

    case "BILLING_ISSUE": {
      await service
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("provider", "apple");
      break;
    }

    case "NON_RENEWING_PURCHASE": {
      // PAYG via the webhook path (the iOS client also calls claim_apple_payg
      // directly, but the webhook is the canonical record).
      if (!txId) break;
      const expiresIn90Days = new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString();
      await service.from("credits").insert({
        user_id: userId,
        contracts_remaining: 1,
        expires_at: expiresIn90Days,
        source: "apple_payg",
        apple_transaction_id: txId,
      });
      await service.from("payments").insert({
        user_id: userId,
        apple_transaction_id: txId,
        provider: "apple",
        kind: "one_off",
        amount_cents: 0,
        currency: "USD",
        status: "succeeded",
        raw: rawJson,
      });
      break;
    }

    case "SUBSCRIBER_ALIAS":
    default: {
      // No-op; logged as an audit row only if there is a transaction id.
      if (txId) {
        await service.from("payments").insert({
          user_id: userId,
          apple_transaction_id: txId,
          provider: "apple",
          kind: "one_off",
          amount_cents: 0,
          currency: "USD",
          status: "succeeded",
          raw: rawJson,
        });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
