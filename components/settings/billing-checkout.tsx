"use client";

import * as React from "react";
import type { PlanId } from "@/lib/supabase/types";

type Props = {
  active: boolean;
  planId: PlanId;
  planLabel: string;
  hasYearly: boolean;
};

export function BillingCheckoutClient({
  active,
  planId,
  planLabel,
  hasYearly,
}: Props) {
  const [interval, setInterval] = React.useState<"month" | "year">("month");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (planId === "free") {
    return (
      <p
        className="gf-mono-sm"
        style={{ color: "var(--fg-3)", margin: 0 }}
      >
        1 scan + 1 draft per month. No card required.
      </p>
    );
  }

  // Map this card's family + chosen interval to a real PlanId.
  const family = planId.startsWith("pro_") ? "pro" : "freelancer";
  const targetPlan = (interval === "month"
    ? `${family}_monthly`
    : `${family}_yearly`) as PlanId;

  const onClick = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "subscription", plan: targetPlan }),
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
      {hasYearly ? (
        <div className="pricing__toggle" role="tablist" aria-label="Billing interval">
          <button
            type="button"
            role="tab"
            aria-selected={interval === "month"}
            onClick={() => setInterval("month")}
            className={"pricing__pill " + (interval === "month" ? "is-on" : "")}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={interval === "year"}
            onClick={() => setInterval("year")}
            className={"pricing__pill " + (interval === "year" ? "is-on" : "")}
          >
            Yearly
          </button>
        </div>
      ) : null}
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
