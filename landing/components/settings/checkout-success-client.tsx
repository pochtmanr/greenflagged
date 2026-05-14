"use client";

import * as React from "react";
import Link from "next/link";

type Provider = "revolut" | "oxapay";

type VerifyResponse =
  | { status: "paid"; quantity?: number; amount_cents?: number; currency?: string }
  | { status: "failed"; reason?: string }
  | { status: "pending"; reason?: string }
  | { status: "unauthenticated" }
  | { status: "missing_order_id" };

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 90_000;

type Props = {
  provider: Provider;
  orderId: string | null;
  quantity: number;
};

export function CheckoutSuccessClient({ provider, orderId, quantity }: Props) {
  const [data, setData] = React.useState<VerifyResponse | null>(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    if (!orderId) return;
    const startedAt = Date.now();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const verifyPath =
      provider === "oxapay"
        ? "/api/billing/oxapay/verify"
        : "/api/billing/revolut/verify";

    const poll = async () => {
      try {
        const url = new URL(verifyPath, window.location.origin);
        url.searchParams.set("order_id", orderId);
        const res = await fetch(url.toString(), { cache: "no-store" });
        const body = (await res.json()) as VerifyResponse;
        if (cancelled) return;

        setData(body);
        setElapsed(Date.now() - startedAt);

        if (body.status === "paid" || body.status === "failed") return;

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setTimedOut(true);
          return;
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (cancelled) return;
        console.error("[checkout-success] poll error", err);
        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          setTimedOut(true);
          return;
        }
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [provider, orderId]);

  if (!orderId) {
    return (
      <Shell
        tag="ERROR"
        sev="red"
        title="Missing order reference"
        body="We couldn't read your order ID. If you just paid, head to billing to see your credits."
      />
    );
  }

  if (data?.status === "paid") {
    const qty = data.quantity ?? quantity;
    const amount =
      typeof data.amount_cents === "number"
        ? `$${(data.amount_cents / 100).toFixed(2)}`
        : `$${(qty * 3).toFixed(2)}`;
    return (
      <Shell
        tag="PAID"
        sev="green"
        title={`Paid — ${qty} contract credit${qty === 1 ? "" : "s"} added`}
        body={`We received ${amount}. Your credits are good for 90 days.`}
      />
    );
  }

  if (data?.status === "failed") {
    return (
      <Shell
        tag="FAILED"
        sev="red"
        title="Payment failed"
        body={data.reason ?? "Payment expired or was declined."}
      />
    );
  }

  if (timedOut) {
    return (
      <Shell
        tag="PENDING"
        sev="yellow"
        title="Still confirming…"
        body="Crypto confirmations can take a few minutes. Your credits will appear in billing once the network confirms — no need to refresh this page."
      />
    );
  }

  const seconds = Math.floor(elapsed / 1000);
  return (
    <Shell
      tag="CONFIRMING"
      sev="yellow"
      title="Confirming your payment"
      body={`Waiting for network confirmation… ${seconds}s elapsed.`}
      orderId={orderId}
    />
  );
}

function Shell({
  tag,
  sev,
  title,
  body,
  orderId,
}: {
  tag: string;
  sev: "green" | "yellow" | "red";
  title: string;
  body: string;
  orderId?: string;
}) {
  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <div
          className="gf-card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 560,
            margin: "32px auto 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span className="gf-label">{"// CHECKOUT"}</span>
            <span className={`gf-tag sev-${sev}`}>{tag}</span>
          </div>
          <h1 className="gf-h3" style={{ margin: 0 }}>
            {title}
          </h1>
          <p className="gf-body" style={{ color: "var(--fg-2)", margin: 0 }}>
            {body}
          </p>
          {orderId ? (
            <div
              className="gf-mono-sm"
              style={{ color: "var(--fg-3)", wordBreak: "break-all" }}
            >
              Order: {orderId}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <Link href="/settings/billing" className="gf-btn">
              View billing <span className="arrow">→</span>
            </Link>
            <Link href="/dashboard" className="gf-btn-link">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
