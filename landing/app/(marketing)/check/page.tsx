import type { Metadata } from "next";
import Link from "next/link";
import { CHECK_TYPES } from "@/content/check-types";
import { BreadcrumbListSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Check contracts online — every contract type, AI-reviewed",
  description:
    "Check any contract online with AI. NDAs, freelance contracts, employment agreements, leases, SaaS MSAs, service agreements, contractor agreements, and influencer brand deals — clause-by-clause review in minutes.",
  alternates: { canonical: "/check" },
  openGraph: {
    url: "/check",
    title: "Check any contract online — Green Flagged",
    description:
      "Clause-by-clause AI review for every common contract type. Drop a PDF and get a verdict in minutes.",
  },
};

export default function CheckIndexPage() {
  const types = Object.values(CHECK_TYPES);

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Check a contract online", url: "/check" },
        ]}
      />
      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div style={{ maxWidth: 760 }}>
            <span className="gf-label">// CHECK A CONTRACT</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              Check any contract
              <br />
              <span style={{ color: "var(--green-500)" }}>online.</span>
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              Pick the kind of contract you&apos;re about to sign. Green
              Flagged walks you through the eight clauses that matter most for
              that contract type, in plain English, in under two minutes.
            </p>
            <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/scan" className="gf-btn">
                Scan a contract now <span className="arrow">→</span>
              </Link>
              <Link href="/how-it-works" className="gf-btn gf-btn-ghost">
                How it works
              </Link>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginTop: 64,
            }}
            className="blog__grid"
          >
            {types.map((t) => (
              <Link
                key={t.slug}
                href={`/check/${t.slug}`}
                className="gf-card"
                style={{ display: "block", textDecoration: "none" }}
              >
                <span className="gf-label">// {t.slug.replace(/-/g, " ").toUpperCase()}</span>
                <h3 className="gf-h4" style={{ marginTop: 16 }}>
                  {t.h1}
                </h3>
                <p className="gf-body-sm" style={{ marginTop: 12, color: "var(--fg-2)" }}>
                  {t.description}
                </p>
                <p
                  className="gf-mono-sm"
                  style={{ marginTop: 16, color: "var(--green-500)" }}
                >
                  Read the checklist →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
