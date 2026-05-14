import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const OXAPAY_BASE = "https://api.oxapay.com/v1";

function apiKey(): string {
  const k = process.env.OXAPAY_MERCHANT_API_KEY;
  if (!k) throw new Error("OXAPAY_MERCHANT_API_KEY missing");
  return k;
}

function sandbox(): boolean {
  return process.env.OXAPAY_SANDBOX === "true";
}

type OxaPayErrorBody = {
  type?: string;
  key?: string;
  message?: string;
};

function isPopulatedError(err: unknown): err is OxaPayErrorBody {
  return (
    err !== null &&
    typeof err === "object" &&
    Object.keys(err as Record<string, unknown>).length > 0
  );
}

export type OxaPayInvoice = {
  track_id: string;
  payment_url: string;
  expired_at: number;
  date: number;
};

export type CreateInvoiceInput = {
  amount: number;
  currency: string;
  orderId: string;
  callbackUrl: string;
  returnUrl: string;
  description: string;
  email?: string;
  lifetimeMinutes?: number;
};

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<OxaPayInvoice> {
  const payload: Record<string, unknown> = {
    amount: input.amount,
    currency: input.currency,
    order_id: input.orderId,
    callback_url: input.callbackUrl,
    return_url: input.returnUrl,
    description: input.description,
    lifetime: input.lifetimeMinutes ?? 60,
    fee_paid_by_payer: 1,
    sandbox: sandbox(),
  };
  if (input.email) payload.email = input.email;

  const res = await fetch(`${OXAPAY_BASE}/payment/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      merchant_api_key: apiKey(),
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: Partial<OxaPayInvoice>;
    error?: OxaPayErrorBody;
    message?: string;
  };
  if (!res.ok || isPopulatedError(json.error)) {
    const msg =
      json.error?.message ??
      json.message ??
      `OxaPay createInvoice failed (${res.status})`;
    throw new Error(`OxaPay createInvoice: ${msg}`);
  }
  const data = json.data;
  if (!data?.track_id || !data?.payment_url) {
    throw new Error("OxaPay createInvoice: missing track_id or payment_url");
  }
  return {
    track_id: String(data.track_id),
    payment_url: String(data.payment_url),
    expired_at: Number(data.expired_at ?? 0),
    date: Number(data.date ?? 0),
  };
}

export type OxaPayPayment = {
  track_id: string;
  status: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  email?: string;
  date?: number;
};

export async function getPayment(
  trackId: string,
): Promise<OxaPayPayment | null> {
  const res = await fetch(
    `${OXAPAY_BASE}/payment/${encodeURIComponent(trackId)}`,
    {
      method: "GET",
      headers: { merchant_api_key: apiKey() },
    },
  );
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as {
    data?: Partial<OxaPayPayment>;
    error?: OxaPayErrorBody;
  };
  if (isPopulatedError(json.error)) return null;
  if (!json.data) return null;
  return {
    track_id: String(json.data.track_id ?? trackId),
    status: String(json.data.status ?? "Unknown"),
    order_id: json.data.order_id ? String(json.data.order_id) : undefined,
    amount:
      typeof json.data.amount === "number" ? json.data.amount : undefined,
    currency: json.data.currency ? String(json.data.currency) : undefined,
    email: json.data.email ? String(json.data.email) : undefined,
    date: typeof json.data.date === "number" ? json.data.date : undefined,
  };
}

/**
 * HMAC-SHA512 over the raw request body signed with the merchant API key.
 * Compared timing-safely against the `hmac` (or `HMAC`/`x-hmac`) header.
 * `rawBody` MUST be the exact bytes received — do not JSON.parse and re-stringify.
 */
export function verifyWebhookSignature(
  rawBody: string,
  hmacHeader: string | null,
): boolean {
  if (!hmacHeader) return false;
  const expected = createHmac("sha512", apiKey())
    .update(rawBody)
    .digest("hex");
  try {
    const a = Buffer.from(hmacHeader, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type OxaPayWebhookPayload = {
  type?: string;
  track_id?: string;
  status?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  email?: string;
  date?: number;
};
