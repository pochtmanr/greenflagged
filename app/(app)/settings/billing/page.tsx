import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { PlanId, PaymentStatus } from "@/lib/supabase/types";
import { PLANS, ONE_OFF } from "@/lib/billing/plans";
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

function fmtPrice(cents: number, interval: "month" | "year" | "once"): string {
  const eur = (cents / 100).toFixed(0);
  if (interval === "once") return `€${eur}`;
  return `€${eur} / ${interval === "month" ? "mo" : "yr"}`;
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
  plan,
  active,
  yearlySaving,
  highlighted,
}: {
  plan: { id: PlanId; label: string; monthly: number; yearly?: number };
  active: boolean;
  yearlySaving?: number;
  highlighted?: boolean;
}) {
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
        €{(plan.monthly / 100).toFixed(0)}
        <span
          className="gf-mono-sm"
          style={{ color: "var(--fg-3)", marginLeft: 8 }}
        >
          / mo
        </span>
      </div>
      {plan.yearly ? (
        <div className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          €{(plan.yearly / 100).toFixed(0)} / yr
          {yearlySaving ? (
            <span style={{ color: "var(--sev-green)", marginLeft: 8 }}>
              save €{yearlySaving}
            </span>
          ) : null}
        </div>
      ) : null}
      <BillingCheckoutClient
        active={active}
        planId={plan.id}
        planLabel={plan.label}
        hasYearly={Boolean(plan.yearly)}
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
                <span className="key">Scans</span>
                <span className="dots" aria-hidden />
                <span className="val">
                  {quota.scans.unlimited
                    ? `${quota.scans.used} · Unlimited`
                    : `${quota.scans.used} / ${quota.scans.limit}`}
                </span>
              </div>
              <div className="gf-specrow">
                <span className="key">Drafts</span>
                <span className="dots" aria-hidden />
                <span className="val">
                  {quota.drafts.unlimited
                    ? `${quota.drafts.used} · Unlimited`
                    : `${quota.drafts.used} / ${quota.drafts.limit}`}
                </span>
              </div>
              {quota.credits.scans + quota.credits.drafts > 0 ? (
                <div className="gf-specrow">
                  <span className="key">Bonus credits</span>
                  <span className="dots" aria-hidden />
                  <span className="val">
                    +{quota.credits.scans} scan / +{quota.credits.drafts} draft
                    {quota.credits.earliest_expires_at
                      ? ` · expires ${fmtDate(quota.credits.earliest_expires_at)}`
                      : ""}
                  </span>
                </div>
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
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
              }}
              className="billing__plans"
            >
              <PlanCard
                plan={{
                  id: "free",
                  label: "Free",
                  monthly: 0,
                }}
                active={planId === "free"}
              />
              <PlanCard
                plan={{
                  id: "freelancer_monthly",
                  label: "Freelancer",
                  monthly: PLANS.freelancer_monthly.price_cents,
                  yearly: PLANS.freelancer_yearly.price_cents,
                }}
                active={
                  planId === "freelancer_monthly" ||
                  planId === "freelancer_yearly"
                }
                yearlySaving={Math.round(
                  (PLANS.freelancer_monthly.price_cents * 12 -
                    PLANS.freelancer_yearly.price_cents) /
                    100,
                )}
                highlighted
              />
              <PlanCard
                plan={{
                  id: "pro_monthly",
                  label: "Pro",
                  monthly: PLANS.pro_monthly.price_cents,
                  yearly: PLANS.pro_yearly.price_cents,
                }}
                active={planId === "pro_monthly" || planId === "pro_yearly"}
                yearlySaving={Math.round(
                  (PLANS.pro_monthly.price_cents * 12 -
                    PLANS.pro_yearly.price_cents) /
                    100,
                )}
              />
            </div>
          </div>

          {/* One-off banner */}
          <div
            className="gf-frame"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <span className="gf-frame-bl" aria-hidden />
            <span className="gf-frame-br" aria-hidden />
            <span className="gf-label">// ONE-OFF</span>
            <h3 className="gf-h3" style={{ margin: 0 }}>
              Just need one contract?
            </h3>
            <p
              className="gf-body-sm"
              style={{ color: "var(--fg-2)", margin: 0 }}
            >
              Buy a single scan + draft for {fmtPrice(ONE_OFF.price_cents, "once")}.
              Valid for {ONE_OFF.ttl_days} days. No subscription required.
            </p>
            <BillingActions kind="one_off" />
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
                        ? "One-off"
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
