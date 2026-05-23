"use client";

import Link from "next/link";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

type Feature = { label: string; included: boolean; comingSoon?: boolean };

type Tier = {
  id: "free" | "payg" | "standard";
  name: string;
  blurb: string;
  price: { amount: number; suffix: string };
  cta: string;
  hot?: boolean;
  features: Feature[];
};

type Props = { signedIn?: boolean; hideHeading?: boolean };

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    blurb: "Test one contract.",
    price: { amount: 0, suffix: "USD" },
    cta: "Start free",
    features: [
      { label: "Contracts per month: 1", included: true },
      { label: "Save contracts and results", included: true },
      { label: "Full clause report", included: true },
      { label: "Clause rewrite suggestions", included: true },
      { label: "Faster analysis queue", included: false },
      { label: "Filter by clause type", included: false },
      { label: "Audit log", included: false },
    ],
  },
  {
    id: "payg",
    name: "Pay as you go",
    blurb: "No commitment, not recurring.",
    price: { amount: 3, suffix: "per contract" },
    cta: "Buy a contract",
    features: [
      { label: "Contracts per month: 0", included: true },
      { label: "Each extra contract: $3.00", included: true },
      { label: "Save contracts and results", included: true },
      { label: "Full clause report", included: true },
      { label: "Clause rewrite suggestions", included: true },
      { label: "Card or crypto checkout", included: true },
      { label: "Faster analysis queue", included: false },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    blurb: "Best for solo adventures.",
    price: { amount: 25, suffix: "per month" },
    cta: "Start with Standard",
    hot: true,
    features: [
      { label: "Contracts per month: 10", included: true },
      { label: "Each extra contract: $3.00", included: true },
      { label: "Save contracts and results", included: true },
      { label: "Full clause report", included: true },
      { label: "Faster analysis queue", included: true },
      { label: "Clause rewrite suggestions", included: true },
      { label: "Filter by clause type", included: true },
      { label: "Audit log", included: true },
      { label: "Team access", included: false, comingSoon: true },
    ],
  },
];

function ctaHref(tier: Tier, signedIn: boolean): string {
  if (signedIn) return `/settings/billing?plan=${tier.id}`;
  return `/sign-up?intent=upgrade&plan=${tier.id}`;
}

export function Pricing({ signedIn = false, hideHeading = false }: Props = {}) {
  return (
    <section
      id="pricing"
      className="section"
      style={hideHeading ? { paddingTop: 0 } : undefined}
    >
      <div className="container" style={{ position: "relative" }}>
        {hideHeading ? null : (
          <SectionHeading
            eyebrow="// 04  Pricing"
            lead="Free, Pay as you go, or Standard. USD, monthly, no yearly lock-in."
          />
        )}
        <div className="pricing__grid">
          {TIERS.map((t, i) => (
            <Reveal
              key={t.id}
              as="div"
              className={"pricing__card " + (t.hot ? "is-hot" : "")}
              delayMs={i * 80}
            >
              {t.hot ? <span className="pricing__hot">MOST POPULAR</span> : null}
              <span className="gf-label">// {t.id.toUpperCase()}</span>
              <h3 className="gf-h3" style={{ margin: "8px 0 6px" }}>
                {t.name}
              </h3>
              <p className="gf-body-sm" style={{ marginTop: 0 }}>
                {t.blurb}
              </p>
              <div className="pricing__price">
                <span className="pricing__amount">${t.price.amount}</span>
                <span className="pricing__period">{t.price.suffix}</span>
              </div>
              <ul className="pricing__feats">
                {t.features.map((f) => (
                  <li
                    key={f.label}
                    className={f.included ? "" : "is-muted"}
                  >
                    <span
                      className="pricing__check"
                      aria-hidden
                      data-state={f.included ? "on" : "off"}
                    >
                      {f.included ? "✓" : "—"}
                    </span>
                    <span>
                      {f.label}
                      {f.comingSoon ? (
                        <em className="pricing__soon"> · coming soon</em>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={ctaHref(t, signedIn)}
                className={"gf-btn " + (t.hot ? "" : "gf-btn-ghost")}
              >
                {t.cta} <span className="arrow">→</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
