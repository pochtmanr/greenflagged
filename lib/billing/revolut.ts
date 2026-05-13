import { createHmac, timingSafeEqual } from "node:crypto";

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
  return env("REVOLUT_API_BASE");
}

function getApiKey(): string {
  return env("REVOLUT_API_KEY");
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
