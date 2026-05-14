"use client";

import * as React from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/marketing/reveal";

type Tier = {
  id: string;
  name: string;
  blurb: string;
  m: { a: number; p: string };
  y: { a: number; p: string };
  cta: string;
  hot?: boolean;
  feats: string[];
};

type Props = { signedIn?: boolean };

// Map tier id + yearly toggle to the canonical PlanId expected by
// /api/billing/checkout. one-off and the free tier don't have a yearly form.
function planSlugFor(tierId: string, yearly: boolean): string {
  if (tierId === "payg") return "one_off";
  if (tierId === "freelancer")
    return yearly ? "freelancer_yearly" : "freelancer_monthly";
  if (tierId === "pro") return yearly ? "pro_yearly" : "pro_monthly";
  return tierId;
}

const TIERS: Tier[] = [
  {
    id: "payg",
    name: "Pay per contract",
    blurb: "Test it first. Pay once, get one full verdict.",
    m: { a: 9, p: "one-off" },
    y: { a: 9, p: "one-off" },
    cta: "Buy one scan",
    feats: [
      "1 full contract analysis",
      "Plain-language explanations",
      "Suggested redline edits",
      "PDF export of the report",
      "Auto-delete after 30 days",
    ],
  },
  {
    id: "freelancer",
    name: "Freelancer",
    blurb: "For active freelancers signing contracts regularly.",
    m: { a: 15, p: "/ month" },
    y: { a: 150, p: "/ year" },
    cta: "Start with Freelancer",
    hot: true,
    feats: [
      "Unlimited contract analyses",
      "History of past reviews",
      "Side-by-side contract comparison",
      "Custom retention (30 / 60 / 90 days)",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro / Agency",
    blurb: "Teams reviewing contracts at scale.",
    m: { a: 39, p: "/ month" },
    y: { a: 390, p: "/ year" },
    cta: "Start with Pro",
    feats: [
      "Everything in Freelancer",
      "3 team seats included",
      "Custom risk profiles per user",
      "Priority AI processing",
      "Contract templates library",
      "Limited API access",
    ],
  },
];

export function Pricing({ signedIn = false }: Props = {}) {
  const [yearly, setYearly] = React.useState(false);

  return (
    <section id="pricing" className="section">
      <div className="container" style={{ position: "relative" }}>
        <SectionHeading
          eyebrow="// 04  Pricing"
          lead="One scan, or unlimited. Your call."
        />
        <div className="pricing__toggle" role="tablist" aria-label="Billing period">
          <button
            type="button"
            role="tab"
            aria-selected={!yearly}
            onClick={() => setYearly(false)}
            className={"pricing__pill " + (!yearly ? "is-on" : "")}
          >
            Monthly
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={yearly}
            onClick={() => setYearly(true)}
            className={"pricing__pill " + (yearly ? "is-on" : "")}
          >
            Yearly <span className="pricing__save">2 mo free</span>
          </button>
        </div>
        <div className="pricing__grid">
          {TIERS.map((t, i) => {
            const b = yearly ? t.y : t.m;
            return (
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
                  <span className="pricing__amount">€{b.a}</span>
                  <span className="pricing__period">{b.p}</span>
                </div>
                <ul className="pricing__feats">
                  {t.feats.map((f) => (
                    <li key={f}>
                      <span className="pricing__check">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={
                    signedIn
                      ? "/settings/billing"
                      : `/sign-up?intent=upgrade&plan=${planSlugFor(t.id, yearly)}`
                  }
                  className={"gf-btn " + (t.hot ? "" : "gf-btn-ghost")}
                >
                  {t.cta} <span className="arrow">→</span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
