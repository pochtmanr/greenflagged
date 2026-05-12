import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Green Flagged is built by a small independent team and operated by Simnetiq Ltd in the EU.",
};

const PRINCIPLES = [
  {
    label: "Plain English",
    body:
      "Every flag is written the way a smart friend would explain it. No Latin, no fine print, no hedging.",
  },
  {
    label: "No surprises",
    body:
      "One flat price. No paywalls mid-verdict. No upsells dressed as warnings. The bill is the bill.",
  },
  {
    label: "Your file, your file",
    body:
      "Contracts are wiped after the verdict. We never train on your documents. The whole company is GDPR by default.",
  },
  {
    label: "Honest about limits",
    body:
      "We're fast, cheap, and accurate enough for 90% of contracts. We will tell you when you need a lawyer.",
  },
];

const STATS = [
  { value: "20€", label: "Per verdict" },
  { value: "<3 min", label: "Median turnaround" },
  { value: "8", label: "Risk categories scored" },
  { value: "EU", label: "Data residency" },
];

export default function AboutPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
              gap: 64,
            }}
            className="about__grid"
          >
            <div>
              <span className="gf-label">// ABOUT</span>
              <h1 className="gf-h1" style={{ marginTop: 14 }}>
                Small team.
                <br />
                <span style={{ color: "var(--green-500)" }}>
                  Strong opinions.
                </span>
              </h1>
            </div>
            <div
              className="gf-body"
              style={{ display: "flex", flexDirection: "column", gap: 24 }}
            >
              <p>
                Green Flagged exists because the cost of bad contracts falls on
                the people least equipped to read them. Freelancers, indie
                founders, and creators sign agreements every week that, on
                re-reading, contain clauses they&apos;d never have agreed to.
                Lawyers are expensive. Templates are generic. Most people sign
                anyway.
              </p>
              <p>
                We&apos;re building the tool we wished we had when we were
                signing our first client contracts: a fast, plain-English read
                that catches the obvious problems and flags the ones worth
                negotiating, without pretending to be a lawyer.
              </p>
              <p>
                The product is built and operated by{" "}
                <a href="https://simnetiq.com" style={{ color: "var(--fg-1)" }}>
                  Simnetiq Ltd
                </a>
                , a small EU-based studio. We process payments through Paddle,
                which acts as our merchant of record and handles VAT compliance
                for EU customers.
              </p>
              <div className="gf-frame" style={{ marginTop: 16 }}>
                <span className="gf-frame-bl" />
                <span className="gf-frame-br" />
                <span className="gf-label">// DISCLAIMER</span>
                <p className="gf-body-sm" style={{ marginTop: 12 }}>
                  Green Flagged is informational and not a substitute for advice
                  from a licensed attorney. Reviews do not create an
                  attorney-client relationship. For decisions that matter, talk
                  to a lawyer in your jurisdiction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section--thin">
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 1,
              background: "var(--rule)",
              border: "1px solid var(--rule)",
            }}
            className="about__stats"
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{ background: "var(--bg)", padding: "40px 32px" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--type-h2)",
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    color: "var(--fg-1)",
                  }}
                >
                  {s.value}
                </div>
                <div className="gf-label" style={{ marginTop: 14 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__heading">
            <span className="gf-label section__eyebrow">// WHAT WE BELIEVE</span>
            <h2 className="gf-h1 section__lead">
              Four <span style={{ color: "var(--green-500)" }}>principles.</span>
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
            className="about__principles"
          >
            {PRINCIPLES.map((p) => (
              <div key={p.label} className="gf-card">
                <span className="gf-label">// {p.label.toUpperCase()}</span>
                <p className="gf-body-sm" style={{ marginTop: 12 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
