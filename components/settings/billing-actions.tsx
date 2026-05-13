"use client";

import * as React from "react";

type Props = { kind: "one_off" };

export function BillingActions({ kind }: Props) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <button
          type="button"
          className="gf-btn"
          onClick={onClick}
          disabled={pending}
        >
          {pending ? "Redirecting…" : "Buy single scan — €9"}{" "}
          <span className="arrow">→</span>
        </button>
      </div>
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
