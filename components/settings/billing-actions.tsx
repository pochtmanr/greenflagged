"use client";

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";

type Props = { kind: "payg"; quantity?: number };

type Method = "card" | "crypto";

export function BillingActions({ kind, quantity = 1 }: Props) {
  const [method, setMethod] = React.useState<Method>("card");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalUsdShort = (3 * quantity).toFixed(0);
  const totalUsdLong = (3 * quantity).toFixed(2);
  const plural = quantity === 1 ? "" : "s";

  const startCard = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, quantity }),
      });
      const data = (await res.json()) as {
        checkout_url?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.checkout_url) {
        setError(data.error ?? "Something went wrong");
        setPending(false);
        return;
      }
      window.location.href = data.checkout_url;
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  };

  const startCrypto = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/oxapay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const data = (await res.json()) as {
        payment_url?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.payment_url) {
        setError(data.error ?? "Something went wrong");
        setPending(false);
        return;
      }
      window.location.href = data.payment_url;
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Tabs.Root
        value={method}
        onValueChange={(v) => setMethod(v as Method)}
        defaultValue="card"
      >
        <Tabs.List className="gf-tabs" aria-label="Payment method">
          <Tabs.Trigger value="card">Card</Tabs.Trigger>
          <Tabs.Trigger value="crypto">Crypto</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content
          value="card"
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            type="button"
            className="gf-btn"
            onClick={startCard}
            disabled={pending}
          >
            {pending
              ? "Redirecting…"
              : `Buy ${quantity} contract credit${plural} — $${totalUsdShort}`}{" "}
            <span className="arrow">→</span>
          </button>
        </Tabs.Content>

        <Tabs.Content
          value="crypto"
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p className="gf-fineprint">
            Pay with any major cryptocurrency. You&apos;ll be redirected to
            OxaPay&apos;s secure checkout. Credits land in your account once the
            network confirms the payment (usually under a minute).
          </p>
          <button
            type="button"
            className="gf-btn gf-btn-accent"
            onClick={startCrypto}
            disabled={pending}
          >
            {pending
              ? "Preparing payment…"
              : `Buy ${quantity} contract credit${plural} — $${totalUsdLong}`}{" "}
            <span className="arrow">→</span>
          </button>
        </Tabs.Content>
      </Tabs.Root>

      {error ? (
        <p
          className="gf-mono-sm"
          style={{ color: "var(--sev-red)", margin: 0 }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
