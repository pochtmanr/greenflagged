"use client";

import * as React from "react";
import type { PlanId } from "@/lib/supabase/types";

type Props = {
  active: boolean;
  planId: PlanId;
  planLabel: string;
};

export function BillingCheckoutClient({ active, planId, planLabel }: Props) {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (planId === "free") {
    return (
      <p
        className="gf-mono-sm"
        style={{ color: "var(--fg-3)", margin: 0 }}
      >
        1 contract per month. No card required.
      </p>
    );
  }

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "subscription", plan: planId }),
      });
      const data = (await res.json()) as {
        checkout_url?: string;
        error?: string;
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <button
        type="button"
        className={"gf-btn " + (active ? "gf-btn-ghost" : "")}
        onClick={onClick}
        disabled={pending || active}
      >
        {active
          ? "Current plan"
          : pending
            ? "Redirecting…"
            : `Upgrade to ${planLabel}`}{" "}
        {!active ? <span className="arrow">→</span> : null}
      </button>
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
