import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { PlanId, PaymentStatus, PaymentKind } from "@/lib/supabase/types";
import { PAYG, PLANS } from "@/lib/billing/plans";
import { getQuota } from "@/lib/billing/quota";
import { BillingActions } from "@/components/settings/billing-actions";
import { BillingCheckoutClient } from "@/components/settings/billing-checkout";
import { BillingTierScroll } from "@/components/settings/billing-tier-scroll";
import { CancelSubscription } from "@/components/settings/cancel-subscription";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata: Metadata = {
  title: "Billing",
  description: "Your Green Flagged plan, usage, and payment history.",
  robots: { index: false, follow: false },
};

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function fmtUsd2(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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

function kindChip(kind: PaymentKind): { label: string; cls: string } {
  switch (kind) {
    case "overage":
      return { label: "OVERAGE", cls: "kind--overage" };
    case "one_off":
      return { label: "PAYG", cls: "kind--payg" };
    case "subscription_initial":
      return { label: "SUBSCRIPTION", cls: "kind--subscription" };
    case "subscription_renewal":
      return { label: "RENEWAL", cls: "kind--subscription" };
  }
}

function startOfMonthIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

type PlanCardData = {
  id: "free" | "payg" | "standard";
  label: string;
  blurb: string;
  priceLabel: string;
  priceSuffix: string;
  features: string[];
};

const PLAN_CARDS: PlanCardData[] = [
  {
    id: "free",
    label: "Free",
    blurb: "Test one contract.",
    priceLabel: "$0",
    priceSuffix: "USD",
    features: [
      "1 contract per month",
      "Full clause report",
      "Clause rewrite suggestions",
    ],
  },
  {
    id: "payg",
    label: "Pay as you go",
    blurb: "No commitment, not recurring.",
    priceLabel: "$3",
    priceSuffix: "per contract",
    features: [
      "Buy credits in 1 / 5 / 10 / 20 packs",
      "Card or crypto checkout",
      `Valid ${PAYG.ttl_days} days`,
    ],
  },
  {
    id: "standard",
    label: "Standard",
    blurb: "Best for solo adventures.",
    priceLabel: "$25",
    priceSuffix: "per month",
    features: [
      "10 contracts per month",
      "Each extra: $3.00 auto-billed",
      "Faster analysis queue",
      "Filter by clause type · Audit log",
    ],
  },
];

function PlanCard({
  card,
  active,
  highlighted,
  targeted,
  currentPlanId,
}: {
  card: PlanCardData;
  active: boolean;
  highlighted?: boolean;
  targeted?: boolean;
  currentPlanId: PlanId;
}) {
  return (
    <div
      className={"gf-card billing-tier" + (targeted ? " is-target" : "")}
      data-tier={card.id}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        borderColor: highlighted ? "var(--accent)" : undefined,
        scrollMarginTop: 120,
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
        <span className="gf-label">// {card.id.toUpperCase()}</span>
        {active ? <span className="gf-tag sev-green">CURRENT</span> : null}
      </div>
      <h3 className="gf-h3" style={{ margin: 0 }}>
        {card.label}
      </h3>
      <p
        className="gf-body-sm"
        style={{ marginTop: 0, color: "var(--fg-2)" }}
      >
        {card.blurb}
      </p>
      <div className="gf-mono" style={{ fontSize: 28, color: "var(--fg-1)" }}>
        {card.priceLabel}
        <span
          className="gf-mono-sm"
          style={{ color: "var(--fg-3)", marginLeft: 8 }}
        >
          {card.priceSuffix}
        </span>
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {card.features.map((f) => (
          <li
            key={f}
            style={{
              display: "flex",
              gap: 10,
              fontSize: 14,
              color: "var(--fg-2)",
            }}
          >
            <span
              aria-hidden
              style={{
                color: "var(--green-500)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        {card.id === "free" ? (
          <p
            className="gf-mono-sm"
            style={{ color: "var(--fg-3)", margin: 0 }}
          >
            {currentPlanId === "free"
              ? "1 contract per month. No card required."
              : "Always available as a fallback."}
          </p>
        ) : card.id === "payg" ? (
          <Link href="#payg-buy" className="gf-btn gf-btn-ghost">
            Buy contracts <span className="arrow">→</span>
          </Link>
        ) : (
          <BillingCheckoutClient
            active={active}
            planId="standard"
            planLabel="Standard"
          />
        )}
      </div>
    </div>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const sp = (await searchParams) ?? {};
  const rawPlan = Array.isArray(sp.plan) ? sp.plan[0] : sp.plan;
  const targetPlan: PlanCardData["id"] | null =
    rawPlan === "free" || rawPlan === "payg" || rawPlan === "standard"
      ? rawPlan
      : null;

  const monthStart = startOfMonthIso();

  const [
    { data: sub },
    { data: payments },
    { count: overageCount },
    quota,
  ] = await Promise.all([
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
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("kind", "overage")
      .eq("status", "succeeded")
      .gte("created_at", monthStart),
    getQuota(user.id),
  ]);

  const planId = (sub?.plan as PlanId | null) ?? "free";
  const isPaidStatus = sub?.status === "active" || sub?.status === "trialing";
  const effectivePlanId: PlanId = isPaidStatus ? planId : "free";
  const planLabel = PLANS[effectivePlanId]?.label ?? "Free";
  const status = sub?.status ?? "active";
  const cancelAtPeriodEnd = sub?.cancel_at_period_end ?? false;
  const periodEnd = sub?.current_period_end ?? null;
  const isPaid = effectivePlanId !== "free";
  const isStandard = effectivePlanId === "standard";
  const overageThisMonth = overageCount ?? 0;

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <SettingsNav current="billing" />
        {targetPlan ? <BillingTierScroll target={targetPlan} /> : null}
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

          {/* This month */}
          <section
            className="gf-card"
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h2 className="gf-h4" style={{ margin: 0 }}>
              This month
            </h2>
            <div className="billing-usage">
              <div>
                <span className="gf-label">Contracts</span>
                <strong>
                  {quota.contracts.unlimited
                    ? `${quota.contracts.used} · ∞`
                    : `${quota.contracts.used} / ${quota.contracts.limit}`}
                </strong>
                {quota.contracts.remaining === 0 &&
                !quota.contracts.unlimited &&
                quota.credits.contracts === 0 &&
                !isStandard ? (
                  <small style={{ color: "var(--sev-orange)" }}>
                    Out of contracts — buy more below.
                  </small>
                ) : null}
              </div>
              <div>
                <span className="gf-label">Credits</span>
                <strong>{quota.credits.contracts}</strong>
                {quota.credits.earliest_expires_at ? (
                  <small>
                    earliest expires{" "}
                    {fmtDate(quota.credits.earliest_expires_at)}
                  </small>
                ) : (
                  <small>—</small>
                )}
              </div>
              {isStandard ? (
                <div>
                  <span className="gf-label">Overages this month</span>
                  <strong>{overageThisMonth}× $3.00</strong>
                  <small>auto-billed via card on file</small>
                </div>
              ) : (
                <div>
                  <span className="gf-label">Plan cap</span>
                  <strong>{PLANS[effectivePlanId].contracts}</strong>
                  <small>per calendar month</small>
                </div>
              )}
            </div>
            {quota.overage ? (
              <p
                className="gf-mono-sm"
                style={{ color: "var(--sev-orange)", margin: 0 }}
              >
                You&apos;ve used your included allowance. Additional contracts
                this month auto-bill at{" "}
                {fmtUsd(PLANS.standard.overage_price_cents ?? 300)} each.
              </p>
            ) : null}
          </section>

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
                card={PLAN_CARDS[0]}
                active={effectivePlanId === "free"}
                targeted={targetPlan === "free"}
                currentPlanId={effectivePlanId}
              />
              <PlanCard
                card={PLAN_CARDS[1]}
                active={false}
                targeted={targetPlan === "payg"}
                currentPlanId={effectivePlanId}
              />
              <PlanCard
                card={PLAN_CARDS[2]}
                active={effectivePlanId === "standard"}
                highlighted
                targeted={targetPlan === "standard"}
                currentPlanId={effectivePlanId}
              />
            </div>
          </div>

          {/* PAYG buy block */}
          <div
            id="payg-buy"
            className="gf-frame"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              scrollMarginTop: 120,
            }}
          >
            <span className="gf-frame-bl" aria-hidden />
            <span className="gf-frame-br" aria-hidden />
            <span className="gf-label">// PAY-AS-YOU-GO</span>
            <h3 className="gf-h3" style={{ margin: 0 }}>
              Buy contract credits.
            </h3>
            <p
              className="gf-body-sm"
              style={{ color: "var(--fg-2)", margin: 0 }}
            >
              {fmtUsd2(PAYG.price_cents)} per credit. Valid {PAYG.ttl_days}{" "}
              days. Pay with card or crypto. No subscription.
            </p>
            <BillingActions kind="payg" showStepper />
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
                {(payments ?? []).map((p) => {
                  const chip = kindChip(p.kind as PaymentKind);
                  return (
                    <div key={p.id} className="gf-specrow">
                      <span
                        className="key"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {fmtDate(p.created_at)}
                        <span className={`gf-tag ${chip.cls}`}>
                          {chip.label}
                        </span>
                        {p.plan &&
                        p.kind !== "overage" &&
                        p.kind !== "one_off" ? (
                          <span style={{ color: "var(--fg-3)" }}>
                            {p.plan}
                          </span>
                        ) : null}
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
