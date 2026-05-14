import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseServiceRole } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { getLeadTo, getMailFrom, getResend } from "@/lib/resend";
import { PLANS } from "./plans";

// Pinned API version per Revolut docs ("The version of the Merchant API is
// specified in YYYY-MM-DD format. If not specified, you will receive an
// error.").
const REVOLUT_API_VERSION = "2024-09-01";

function env(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

function getApiBase(): string {
  // REVOLUT_ENVIRONMENT is the canonical switch the user keeps in .env.
  // Anything other than the literal "sandbox" hits production. Both bases
  // share the same /api/* path layout.
  const envName = process.env.REVOLUT_ENVIRONMENT;
  if (!envName) {
    throw new Error("Missing required env: REVOLUT_ENVIRONMENT");
  }
  return envName === "sandbox"
    ? "https://sandbox-merchant.revolut.com"
    : "https://merchant.revolut.com";
}

function getApiKey(): string {
  return env("REVOLUT_SECRET_KEY");
}

function getWebhookSecret(): string {
  return env("REVOLUT_WEBHOOK_SECRET");
}

function headers(idempotencyKey?: string): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Revolut-Api-Version": REVOLUT_API_VERSION,
  };
  if (idempotencyKey) h["Idempotency-Key"] = idempotencyKey;
  return h;
}

async function revolutFetch<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string },
): Promise<T> {
  const { idempotencyKey, ...rest } = init;
  const res = await fetch(`${getApiBase()}${path}`, {
    ...rest,
    headers: { ...headers(idempotencyKey), ...(rest.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new RevolutApiError(res.status, path, text);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new RevolutApiError(res.status, path, text, "Invalid JSON response");
  }
}

export class RevolutApiError extends Error {
  status: number;
  path: string;
  bodyText: string;
  constructor(status: number, path: string, bodyText: string, msg?: string) {
    super(
      msg ??
        `Revolut API ${status} ${path}: ${bodyText.slice(0, 500) || "(empty body)"}`,
    );
    this.name = "RevolutApiError";
    this.status = status;
    this.path = path;
    this.bodyText = bodyText;
  }
}

// ===== Orders =====

export type CreateOrderInput = {
  amount_cents: number;
  currency: string;
  description: string;
  customer_email?: string;
  customer_id?: string;
  metadata?: Record<string, string>;
  redirect_url?: string;
  // When the merchant intends to save the card for off-session reuse,
  // Revolut requires a SetupFutureUsage hint. Defaults to false; pass true
  // for subscription_initial orders.
  save_payment_method_for_merchant?: boolean;
};

export type RevolutOrder = {
  id: string;
  token: string;
  // Hosted checkout URL — present when an order was created without an
  // attached payment method.
  checkout_url: string;
  state: string;
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<RevolutOrder> {
  const body: Record<string, unknown> = {
    amount: input.amount_cents,
    currency: input.currency,
    description: input.description,
    metadata: input.metadata ?? {},
  };
  if (input.redirect_url) body.redirect_url = input.redirect_url;
  if (input.customer_id) body.customer = { id: input.customer_id };
  else if (input.customer_email)
    body.customer = { email: input.customer_email };
  if (input.save_payment_method_for_merchant) {
    body.save_payment_method_for_merchant = true;
  }

  return revolutFetch<RevolutOrder>("/api/orders", {
    method: "POST",
    body: JSON.stringify(body),
    idempotencyKey: input.metadata?.idempotency_key,
  });
}

export type RevolutCustomer = {
  id: string;
  email?: string;
  full_name?: string;
  created_at?: string;
};

export async function createCustomer(input: {
  email: string;
  full_name?: string;
}): Promise<RevolutCustomer> {
  return revolutFetch<RevolutCustomer>("/api/customers", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      full_name: input.full_name,
    }),
  });
}

// Charge a customer's saved payment method off-session (merchant-initiated).
//
// Two-step per Revolut docs: (1) create an order for the customer, (2) call
// Pay for an order with `initiator: merchant` and the saved payment_method_id.
// We wrap both steps so renewal callers have a single entrypoint.
export async function chargeSavedCard(input: {
  customer_id: string;
  payment_method_id: string;
  amount_cents: number;
  currency: string;
  description: string;
  idempotency_key: string;
  metadata?: Record<string, string>;
}): Promise<{ order: RevolutOrder; pay_result: unknown }> {
  const order = await createOrder({
    amount_cents: input.amount_cents,
    currency: input.currency,
    description: input.description,
    customer_id: input.customer_id,
    metadata: { ...(input.metadata ?? {}), idempotency_key: input.idempotency_key },
  });
  const pay_result = await revolutFetch<unknown>(
    `/api/orders/${order.id}/pay`,
    {
      method: "POST",
      idempotencyKey: input.idempotency_key,
      body: JSON.stringify({
        payment_method_id: input.payment_method_id,
        initiator: "merchant",
      }),
    },
  );
  return { order, pay_result };
}

export async function retrieveOrder(orderId: string): Promise<RevolutOrder & {
  customer_id?: string;
  payment_method_id?: string;
  state: string;
}> {
  return revolutFetch(`/api/orders/${orderId}`, { method: "GET" });
}

// ===== Overage MIT (Standard tier, $3/contract over included cap) =====

export type ChargeOverageResult =
  | { ok: true; revolut_order_id: string; amount_cents: number; status: "succeeded" | "pending" }
  | { ok: false; reason: "no_saved_card" | "already_charged_failed" | "charge_failed"; detail?: string };

type PayResultLike = { state?: string } | null | undefined;

function payResultState(pay: PayResultLike): string | null {
  if (pay && typeof pay === "object" && typeof (pay as { state?: unknown }).state === "string") {
    return (pay as { state: string }).state;
  }
  return null;
}

function isTerminalSuccessState(state: string | null): boolean {
  return state === "COMPLETED" || state === "AUTHORISED";
}

function isTerminalFailureState(state: string | null): boolean {
  return (
    state === "FAILED" ||
    state === "CANCELLED" ||
    state === "DECLINED"
  );
}

/**
 * Off-session MIT charge for a single Standard-tier overage contract.
 *
 * Idempotent on (user_id, contract_id): a prior succeeded row is returned
 * as-is; a prior failed row short-circuits so we don't endlessly retry a
 * dead card in the response path.
 *
 * Callers (route handlers) MUST NOT await this on the response path — fire
 * and forget. Failures surface via past_due + Resend ops alert; the webhook
 * still finalizes pending rows when the merchant order resolves async.
 */
export async function chargeOverage(
  userId: string,
  contractId: string,
): Promise<ChargeOverageResult> {
  const svc = getSupabaseServiceRole();

  // Idempotency: skip if we already booked an overage for this contract.
  const { data: existing } = await svc
    .from("payments")
    .select("revolut_order_id, status, amount_cents")
    .eq("user_id", userId)
    .eq("kind", "overage")
    .filter("raw->>contract_id", "eq", contractId)
    .maybeSingle();
  if (existing) {
    if (existing.status === "succeeded") {
      return {
        ok: true,
        revolut_order_id: existing.revolut_order_id ?? "",
        amount_cents: existing.amount_cents,
        status: "succeeded",
      };
    }
    if (existing.status === "pending") {
      return {
        ok: true,
        revolut_order_id: existing.revolut_order_id ?? "",
        amount_cents: existing.amount_cents,
        status: "pending",
      };
    }
    if (existing.status === "failed") {
      return { ok: false, reason: "already_charged_failed" };
    }
  }

  const { data: sub } = await svc
    .from("subscriptions")
    .select("plan, status, revolut_customer_id, revolut_payment_method_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (
    !sub ||
    sub.plan !== "standard" ||
    sub.status !== "active" ||
    !sub.revolut_customer_id ||
    !sub.revolut_payment_method_id
  ) {
    return { ok: false, reason: "no_saved_card" };
  }

  const amount_cents = PLANS.standard.overage_price_cents ?? 300;
  const currency = PLANS.standard.currency;
  const idempotency_key = `overage:${userId}:${contractId}`;

  // Pre-insert pending audit row keyed on contract_id so future calls
  // (race window before Revolut responds) collapse via the idempotency
  // lookup above.
  const { data: paymentRow, error: insertErr } = await svc
    .from("payments")
    .insert({
      user_id: userId,
      revolut_order_id: null,
      kind: "overage",
      plan: "standard",
      amount_cents,
      currency,
      status: "pending",
      provider: "revolut",
      raw: { contract_id: contractId, idempotency_key } as Json,
    })
    .select("id")
    .single();
  if (insertErr || !paymentRow) {
    return {
      ok: false,
      reason: "charge_failed",
      detail: insertErr?.message ?? "payment_insert_failed",
    };
  }

  let orderId: string | null = null;
  try {
    const { order, pay_result } = await chargeSavedCard({
      customer_id: sub.revolut_customer_id,
      payment_method_id: sub.revolut_payment_method_id,
      amount_cents,
      currency,
      description: "Contract overage — Green Flagged Standard",
      idempotency_key,
      metadata: { user_id: userId, contract_id: contractId, kind: "overage" },
    });
    orderId = order.id;

    const state = payResultState(pay_result as PayResultLike);
    const terminalSuccess = isTerminalSuccessState(state);
    const terminalFailure = isTerminalFailureState(state);

    if (terminalFailure) {
      await svc
        .from("payments")
        .update({
          revolut_order_id: order.id,
          status: "failed",
          raw: {
            contract_id: contractId,
            idempotency_key,
            order: order as unknown,
            pay_result: pay_result as unknown,
          } as Json,
        })
        .eq("id", paymentRow.id);
      await markPastDueAndAlert(userId, `pay_state=${state ?? "unknown"}`);
      return { ok: false, reason: "charge_failed", detail: state ?? "unknown" };
    }

    await svc
      .from("payments")
      .update({
        revolut_order_id: order.id,
        status: terminalSuccess ? "succeeded" : "pending",
        raw: {
          contract_id: contractId,
          idempotency_key,
          order: order as unknown,
          pay_result: pay_result as unknown,
        } as Json,
      })
      .eq("id", paymentRow.id);

    return {
      ok: true,
      revolut_order_id: order.id,
      amount_cents,
      status: terminalSuccess ? "succeeded" : "pending",
    };
  } catch (err) {
    const detail =
      err instanceof RevolutApiError
        ? `${err.status} ${err.bodyText.slice(0, 200)}`
        : err instanceof Error
          ? err.message
          : String(err);
    await svc
      .from("payments")
      .update({
        revolut_order_id: orderId,
        status: "failed",
        raw: { contract_id: contractId, idempotency_key, error: detail } as Json,
      })
      .eq("id", paymentRow.id);
    await markPastDueAndAlert(userId, detail);
    return { ok: false, reason: "charge_failed", detail };
  }
}

async function markPastDueAndAlert(userId: string, detail: string): Promise<void> {
  const svc = getSupabaseServiceRole();
  await svc
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  try {
    const resend = getResend();
    await resend.emails.send({
      from: getMailFrom(),
      to: getLeadTo(),
      subject: "[Green Flagged] Standard overage charge failed",
      html: `<p>User <code>${userId}</code> — saved card declined an overage MIT.</p><p>Subscription is now <strong>past_due</strong>. Reason: <code>${detail}</code>.</p>`,
    });
  } catch {
    // Best effort; the failed payment row already captured the error.
  }
}

// ===== Webhook signature verification =====
//
// Revolut signs each webhook with HMAC-SHA256. The `Revolut-Signature` header
// holds one or more comma-separated signatures, each formatted `v1=<hex>`.
// The payload to sign is `v1.<timestamp>.<raw_body>` where `<timestamp>` is
// from the `Revolut-Request-Timestamp` header.
//
// We also reject events older than 5 minutes to mitigate replay.
export type SignatureVerifyInput = {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
};

export type SignatureVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

const REPLAY_TOLERANCE_MS = 5 * 60 * 1000;

export function verifyWebhookSignature(
  input: SignatureVerifyInput,
): SignatureVerifyResult {
  const { rawBody, signatureHeader, timestampHeader } = input;
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };
  if (!timestampHeader) return { ok: false, reason: "missing_timestamp" };

  const tsMs = Number(timestampHeader);
  if (!Number.isFinite(tsMs)) return { ok: false, reason: "bad_timestamp" };
  if (Math.abs(Date.now() - tsMs) > REPLAY_TOLERANCE_MS) {
    return { ok: false, reason: "timestamp_outside_tolerance" };
  }

  const payloadToSign = `v1.${timestampHeader}.${rawBody}`;
  const expectedHex = createHmac("sha256", getWebhookSecret())
    .update(payloadToSign)
    .digest("hex");
  const expected = `v1=${expectedHex}`;

  // Header may carry multiple comma-separated signatures (signing-key rotation).
  // Constant-time compare against each.
  const provided = signatureHeader.split(",").map((s) => s.trim());
  const expectedBuf = Buffer.from(expected);
  for (const p of provided) {
    const pBuf = Buffer.from(p);
    if (pBuf.length === expectedBuf.length && timingSafeEqual(pBuf, expectedBuf)) {
      return { ok: true };
    }
  }
  return { ok: false, reason: "signature_mismatch" };
}
