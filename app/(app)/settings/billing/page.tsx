import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { PlanId, PaymentStatus } from "@/lib/supabase/types";
import { PAYG, PLANS } from "@/lib/billing/plans";
import { getQuota } from "@/lib/billing/quota";
import { BillingActions } from "@/components/settings/billing-actions";
import { BillingCheckoutClient } from "@/components/settings/billing-checkout";
import { CancelSubscription } from "@/components/settings/cancel-subscription";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata: Metadata = {
  title: "Billing",
  description: "Your Green Flagged plan, usage, and payment history.",
  robots: { index: false, follow: false },
};

// NOTE: This page is a thin compile-time shim updated in phase 11 so the
// pricing-v2 foundation lands without a broken /settings/billing route.
// Prompt 14 owns the proper redesign (cards, copy, overage UI).

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtAmount(cents: number, currency: string): string {
  return `${(cents / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function statusSeverity(status: PaymentStatus): "green" | "yellow" | "red" {
  switch (status) {
    case "succeeded":
      return "green";
    case "pending":
      return "yellow";
    case "refunded":
      return "yellow";
    case "failed":
      return "red";
  }
}

function statusLabel(status: PaymentStatus): string {
  switch (status) {
    case "succeeded":
      return "PAID";
    case "pending":
      return "PENDING";
    case "refunded":
      return "REFUNDED";
    case "failed":
      return "FAILED";
  }
}

function PlanCard({
  planId,
  active,
  highlighted,
}: {
  planId: PlanId;
  active: boolean;
  highlighted?: boolean;
}) {
  const plan = PLANS[planId];
  return (
    <div
      className="gf-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        borderColor: highlighted ? "var(--accent)" : undefined,
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
        <span className="gf-label">// {plan.id.toUpperCase()}</span>
        {active ? <span className="gf-tag sev-green">CURRENT</span> : null}
      </div>
      <h3 className="gf-h3" style={{ margin: 0 }}>
        {plan.label}
      </h3>
      <div className="gf-mono" style={{ fontSize: 28, color: "var(--fg-1)" }}>
        {fmtUsd(plan.price_cents)}
        <span
          className="gf-mono-sm"
          style={{ color: "var(--fg-3)", marginLeft: 8 }}
        >
          / mo
        </span>
      </div>
      <div className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
        {plan.contracts} contract{plan.contracts === 1 ? "" : "s"} / month
        {plan.overage_price_cents
          ? ` · then ${fmtUsd(plan.overage_price_cents)} each`
          : ""}
      </div>
      <BillingCheckoutClient
        active={active}
        planId={plan.id}
        planLabel={plan.label}
      />
    </div>
  );
}

export default async function BillingPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [{ data: sub }, { data: payments }, quota] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "plan, status, current_period_start, current_period_end, cancel_at_period_end",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, kind, plan, amount_cents, currency, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    getQuota(user.id),
  ]);

  const planId = (sub?.plan as PlanId | null) ?? "free";
  const planLabel = PLANS[planId]?.label ?? "Free";
  const status = sub?.status ?? "active";
  const cancelAtPeriodEnd = sub?.cancel_at_period_end ?? false;
  const periodEnd = sub?.current_period_end ?? null;

  const isPaid = planId !== "free";

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <SettingsNav current="billing" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            marginTop: 32,
          }}
        >
          <header
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <span className="gf-label">// BILLING</span>
            <h1 className="gf-h1">Plan &amp; usage</h1>
            <p className="gf-body" style={{ color: "var(--fg-2)" }}>
              Manage your subscription, top-ups, and payment history.{" "}
              <Link
                href="/settings"
                className="gf-btn-link"
                style={{ marginLeft: 4 }}
              >
                Back to settings
              </Link>
            </p>
          </header>

          {/* Current plan */}
          <div
            className="gf-card"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h2 className="gf-h4" style={{ margin: 0 }}>
                Current plan
              </h2>
              {status === "active" ? (
                <span className="gf-tag sev-green">ACTIVE</span>
              ) : status === "past_due" ? (
                <span className="gf-tag sev-orange">PAST DUE</span>
              ) : status === "canceled" ? (
                <span className="gf-tag sev-yellow">CANCELED</span>
              ) : status === "trialing" ? (
                <span className="gf-tag sev-green">TRIAL</span>
              ) : (
                <span className="gf-tag sev-yellow">EXPIRED</span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="gf-specrow">
                <span className="key">Plan</span>
                <span className="dots" aria-hidden />
                <span className="val">{planLabel}</span>
              </div>
              <div className="gf-specrow">
                <span className="key">
                  {cancelAtPeriodEnd ? "Access ends" : "Renews on"}
                </span>
                <span className="dots" aria-hidden />
                <span className="val">
                  {isPaid ? fmtDate(periodEnd) : "Never (free tier)"}
                </span>
              </div>
              <div className="gf-specrow">
                <span className="key">Status</span>
                <span className="dots" aria-hidden />
                <span className="val">{status.toUpperCase()}</span>
              </div>
            </div>
            {isPaid && !cancelAtPeriodEnd ? (
              <div>
                <CancelSubscription periodEnd={periodEnd} />
              </div>
            ) : null}
            {cancelAtPeriodEnd ? (
              <p
                className="gf-mono-sm"
                style={{ color: "var(--fg-3)", margin: 0 }}
              >
                Your subscription is set to cancel at the end of the current
                period. You&apos;ll keep access until {fmtDate(periodEnd)}.
              </p>
            ) : null}
          </div>

          {/* Usage this month */}
          <div
            className="gf-card"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h2 className="gf-h4" style={{ margin: 0 }}>
              Usage this month
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="gf-specrow">
                <span className="key">Contracts</span>
                <span className="dots" aria-hidden />
                <span className="val">
                  {quota.contracts.unlimited
                    ? `${quota.contracts.used} · Unlimited`
                    : `${quota.contracts.used} / ${quota.contracts.limit}`}
                </span>
              </div>
              {quota.credits.contracts > 0 ? (
                <div className="gf-specrow">
                  <span className="key">Credits</span>
                  <span className="dots" aria-hidden />
                  <span className="val">
                    +{quota.credits.contracts} contract
                    {quota.credits.contracts === 1 ? "" : "s"}
                    {quota.credits.earliest_expires_at
                      ? ` · expires ${fmtDate(quota.credits.earliest_expires_at)}`
                      : ""}
                  </span>
                </div>
              ) : null}
              {quota.overage ? (
                <p
                  className="gf-mono-sm"
                  style={{ color: "var(--sev-orange)", margin: 0 }}
                >
                  You&apos;ve used your included allowance. Additional contracts
                  this month will be auto-billed at {fmtUsd(PLANS.standard.overage_price_cents ?? 300)} each.
                </p>
              ) : null}
            </div>
          </div>

          {/* Plans grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 className="gf-h4" style={{ margin: 0 }}>
              Plans
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 16,
              }}
              className="billing__plans"
            >
              <PlanCard planId="free" active={planId === "free"} />
              <PlanCard
                planId="standard"
                active={planId === "standard"}
                highlighted
              />
            </div>
          </div>

          {/* PAYG banner */}
          <div
            className="gf-frame"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <span className="gf-frame-bl" aria-hidden />
            <span className="gf-frame-br" aria-hidden />
            <span className="gf-label">// PAY-AS-YOU-GO</span>
            <h3 className="gf-h3" style={{ margin: 0 }}>
              Just need one contract?
            </h3>
            <p
              className="gf-body-sm"
              style={{ color: "var(--fg-2)", margin: 0 }}
            >
              Buy a single contract credit for {fmtUsd(PAYG.price_cents)}.
              Valid for {PAYG.ttl_days} days. No subscription required.
            </p>
            <BillingActions kind="payg" />
          </div>

          {/* Payment history */}
          <div
            className="gf-card"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h2 className="gf-h4" style={{ margin: 0 }}>
              Payment history
            </h2>
            {(payments ?? []).length === 0 ? (
              <p
                className="gf-body-sm"
                style={{ color: "var(--fg-3)", margin: 0 }}
              >
                No payments yet.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                {(payments ?? []).map((p) => (
                  <div key={p.id} className="gf-specrow">
                    <span className="key">
                      {fmtDate(p.created_at)} ·{" "}
                      {p.kind === "one_off"
                        ? "PAYG credit"
                        : p.kind === "overage"
                          ? "Overage"
                          : p.kind === "subscription_initial"
                            ? `${p.plan ?? ""} (initial)`
                            : `${p.plan ?? ""} (renewal)`}
                    </span>
                    <span className="dots" aria-hidden />
                    <span className="val">
                      {fmtAmount(p.amount_cents, p.currency)}{" "}
                      <span
                        className={`gf-tag sev-${statusSeverity(p.status as PaymentStatus)}`}
                        style={{ marginLeft: 8 }}
                      >
                        {statusLabel(p.status as PaymentStatus)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
