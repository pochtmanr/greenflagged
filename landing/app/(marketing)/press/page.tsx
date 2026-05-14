import type { Metadata } from "next";
import Link from "next/link";
import {
  SITE_NAME,
  SITE_URL,
  COMPANY_NAME,
  COMPANY_COUNTRY,
  PRESS_EMAIL,
} from "@/lib/config";
import { BreadcrumbListSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Press kit — Green Flagged",
  description:
    "Press kit for Green Flagged: the AI contract review tool for freelancers, founders, and creators. Logos, founder bio, fact sheet, brand colors.",
  alternates: { canonical: "/press" },
  openGraph: {
    url: "/press",
    title: "Press kit — Green Flagged",
    description:
      "Press kit for Green Flagged. Logos, founder bio, fact sheet, brand colors.",
  },
};

const FACTS: { label: string; value: string }[] = [
  { label: "Product", value: "Green Flagged — AI contract review" },
  { label: "Company", value: `${COMPANY_NAME} (${COMPANY_COUNTRY})` },
  { label: "Founded", value: "2025" },
  { label: "Founder", value: "Roman Pochtman" },
  { label: "Stage", value: "Independent / bootstrapped" },
  { label: "Audience", value: "Freelancers, founders, creators, small agencies" },
  { label: "Pricing", value: "Free first scan · $3 PAYG · $25/month Standard" },
  { label: "Press contact", value: PRESS_EMAIL },
  { label: "Website", value: SITE_URL.replace(/^https?:\/\//, "") },
];

const BRAND_ASSETS: { label: string; href: string; format: string }[] = [
  { label: "Logo (SVG)", href: "/logo.svg", format: "SVG" },
  { label: "Logo (PNG)", href: "/logo.png", format: "PNG" },
  { label: "Favicon", href: "/favicon.svg", format: "SVG" },
  { label: "Open Graph image (1200×630)", href: "/og.png", format: "PNG" },
];

const COLORS: { name: string; hex: string }[] = [
  { name: "Sage Primary", hex: "#4A7A5C" },
  { name: "Sage Accent", hex: "#94B5A1" },
  { name: "Severity Yellow", hex: "#FFD600" },
  { name: "Severity Orange", hex: "#FF8A1F" },
  { name: "Severity Red", hex: "#FF3D5C" },
  { name: "Page Dark", hex: "#121212" },
  { name: "Paper Light", hex: "#FBFAF6" },
];

export default function PressPage() {
  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Press", url: "/press" },
        ]}
      />

      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div style={{ maxWidth: 760 }}>
            <span className="gf-label">// PRESS KIT</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              Press kit.
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              Everything journalists, analysts, and review sites need to write
              about {SITE_NAME}. Use, share, and modify the materials below
              freely.
            </p>
            <p className="gf-body-sm" style={{ marginTop: 16 }}>
              For interview requests or quotes:{" "}
              <a
                href={`mailto:${PRESS_EMAIL}`}
                style={{ borderBottom: "1px solid currentColor", color: "var(--fg-1)" }}
              >
                {PRESS_EMAIL}
              </a>
            </p>
          </div>

          <div
            style={{
              marginTop: 64,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 48,
            }}
            className="contact__grid"
          >
            <div>
              <span className="gf-label">// ONE-LINER</span>
              <p className="gf-body" style={{ marginTop: 14, fontSize: 17 }}>
                {SITE_NAME} is an AI-powered contract review tool that scans any
                contract for risk, ranks the clauses, and tells you in plain
                English what to push back on before you sign.
              </p>
              <p
                className="gf-body-sm"
                style={{ marginTop: 16, color: "var(--fg-2)" }}
              >
                Built for the people who sign contracts without a lawyer in the
                room — freelancers, indie founders, creators, and small
                agencies. Free first scan, no account needed.
              </p>
            </div>

            <div>
              <span className="gf-label">// FOUNDER</span>
              <p className="gf-body" style={{ marginTop: 14, fontSize: 17 }}>
                Roman Pochtman — founder.
              </p>
              <p
                className="gf-body-sm"
                style={{ marginTop: 16, color: "var(--fg-2)" }}
              >
                Technical founder with multiple shipped products. Built{" "}
                {SITE_NAME} after watching freelancer friends sign contracts
                they didn&apos;t fully understand, one bad clause at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="container">
          <span className="gf-label">// FACT SHEET</span>
          <h2 className="gf-h2" style={{ marginTop: 14 }}>Fact sheet</h2>
          <div
            className="gf-card"
            style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}
          >
            {FACTS.map((f) => (
              <div key={f.label} className="gf-specrow">
                <span className="key">{f.label}</span>
                <span className="dots" />
                <span className="val">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <span className="gf-label">// BRAND ASSETS</span>
          <h2 className="gf-h2" style={{ marginTop: 14 }}>Brand assets</h2>
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
            className="blog__grid"
          >
            {BRAND_ASSETS.map((a) => (
              <a
                key={a.href}
                href={a.href}
                download
                className="gf-card"
                style={{ display: "block", textDecoration: "none" }}
              >
                <span className="gf-label">// DOWNLOAD · {a.format}</span>
                <h3 className="gf-h4" style={{ marginTop: 12 }}>
                  {a.label}
                </h3>
                <p
                  className="gf-mono-sm"
                  style={{ marginTop: 12, color: "var(--green-500)" }}
                >
                  Download →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="container">
          <span className="gf-label">// BRAND COLORS</span>
          <h2 className="gf-h2" style={{ marginTop: 14 }}>Brand colors</h2>
          <div
            style={{
              marginTop: 32,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {COLORS.map((c) => (
              <div key={c.hex} className="gf-card">
                <div
                  style={{
                    width: "100%",
                    height: 64,
                    background: c.hex,
                    border: "1px solid var(--rule)",
                  }}
                />
                <p className="gf-body-sm" style={{ marginTop: 12, fontWeight: 600 }}>
                  {c.name}
                </p>
                <p
                  className="gf-mono-sm"
                  style={{ marginTop: 4, color: "var(--fg-3)" }}
                >
                  {c.hex}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="gf-card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <h2 className="gf-h2">Want to write about {SITE_NAME}?</h2>
            <p
              className="gf-body"
              style={{ marginTop: 16, maxWidth: 540, margin: "16px auto 0", color: "var(--fg-2)" }}
            >
              Roman is available for interviews, podcasts, and product reviews.
              Reach out at{" "}
              <a
                href={`mailto:${PRESS_EMAIL}`}
                style={{ borderBottom: "1px solid currentColor", color: "var(--fg-1)" }}
              >
                {PRESS_EMAIL}
              </a>
              .
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" className="gf-btn">
                See the product <span className="arrow">→</span>
              </Link>
              <Link href="/about" className="gf-btn gf-btn-ghost">
                About the team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
