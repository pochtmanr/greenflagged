import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { PAYG } from "@/lib/billing/plans";
import {
  verifyWebhookSignature,
  type OxaPayWebhookPayload,
} from "@/lib/billing/oxapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OxaPay requires `200 ok` plain-text body to stop retrying.
function ok() {
  return new NextResponse("ok", { status: 200 });
}

function log(stage: string, data: Record<string, unknown>) {
  console.log(`[oxapay-webhook] ${stage}`, JSON.stringify(data));
}

function mergeRaw(existing: Json | null, webhook: OxaPayWebhookPayload): Json {
  const base: Record<string, Json> =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, Json>)
      : {};
  return { ...base, webhook: webhook as unknown as Json };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac =
    req.headers.get("hmac") ??
    req.headers.get("HMAC") ??
    req.headers.get("x-hmac");

  if (!verifyWebhookSignature(rawBody, hmac)) {
    log("reject_bad_signature", { hasHmac: !!hmac });
    return new NextResponse("invalid signature", { status: 401 });
  }

  let payload: OxaPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as OxaPayWebhookPayload;
  } catch {
    return new NextResponse("invalid body", { status: 400 });
  }

  // Ignore non-invoice callbacks (e.g. payouts).
  if (payload.type && payload.type !== "invoice") return ok();

  const trackId = payload.track_id;
  const status = String(payload.status ?? "").toLowerCase();

  if (!trackId) {
    log("missing_track_id", { payload });
    return ok();
  }

  const svc = getSupabaseServiceRole();
  const { data: row } = await svc
    .from("payments")
    .select("id, user_id, status, raw, amount_cents")
    .eq("oxapay_track_id", trackId)
    .maybeSingle();

  if (!row) {
    // Unknown invoice — ack so OxaPay stops retrying.
    log("unknown_track_id", { trackId });
    return ok();
  }

  // Idempotency.
  if (row.status === "succeeded") {
    log("idempotent_skip", { trackId, payment_id: row.id });
    return ok();
  }

  if (
    status === "expired" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "canceled"
  ) {
    await svc
      .from("payments")
      .update({
        status: "failed",
        raw: mergeRaw(row.raw, payload),
      })
      .eq("id", row.id);
    log("payment_failed", { trackId, status });
    return ok();
  }

  if (status === "paid") {
    const rawObj =
      row.raw && typeof row.raw === "object"
        ? (row.raw as Record<string, unknown>)
        : null;
    const rawQty =
      typeof rawObj?.quantity === "number"
        ? rawObj.quantity
        : typeof rawObj?.quantity === "string"
          ? Number.parseInt(rawObj.quantity, 10)
          : NaN;
    const quantity = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
    const expires_at = new Date(
      Date.now() + PAYG.ttl_days * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: creditErr } = await svc.from("credits").insert({
      user_id: row.user_id,
      contracts_remaining: PAYG.contracts * quantity,
      expires_at,
      source: PAYG.source,
    });
    if (creditErr) {
      // Log loud but still 200-ack — re-running this webhook would be a
      // safe operation only because of the idempotency check above. If the
      // insert keeps failing, ops will see the unconverted pending row.
      log("credit_insert_failed", { trackId, err: creditErr.message });
      return ok();
    }

    await svc
      .from("payments")
      .update({
        status: "succeeded",
        raw: mergeRaw(row.raw, payload),
      })
      .eq("id", row.id);

    log("paid", { trackId, payment_id: row.id, quantity });
    return ok();
  }

  // Intermediate states (paying/confirming) — no DB write, just ack.
  log("intermediate", { trackId, status });
  return ok();
}
