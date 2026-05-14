import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Use cases",
  description:
    "Built for freelancers, agencies, founders, and creators. Get the verdict before you sign anything.",
};

type Severity = "red" | "orange" | "yellow" | "green";

const CASES: Array<{
  id: string;
  title: string;
  pitch: string;
  examples: string[];
  flag: { severity: Severity; title: string; body: string };
}> = [
  {
    id: "freelancers",
    title: "Freelancers",
    pitch:
      "You sign more contracts than your last lawyer ever did. We give you the same vocabulary they use.",
    examples: [
      "Web/design services agreements",
      "Brand engagements and SOWs",
      "Consulting retainers",
      "Subcontractor pass-through deals",
    ],
    flag: {
      severity: "red",
      title: "Typical red flag",
      body:
        '"All IP, including pre-existing work, transfers to Client on delivery." — Insert a prior-work carve-out or refuse.',
    },
  },
  {
    id: "agencies",
    title: "Agencies",
    pitch:
      "Vendor, partnership, and reseller contracts pile up. Run them all through one consistent risk framework.",
    examples: [
      "Vendor and supplier agreements",
      "Reseller and partnership contracts",
      "Independent contractor agreements",
      "Master services agreements + SOWs",
    ],
    flag: {
      severity: "orange",
      title: "Typical warning",
      body:
        "Most-favored-nation pricing clauses that auto-discount your rate. Cap them by term or scope.",
    },
  },
  {
    id: "founders",
    title: "Founders",
    pitch:
      "SAFEs, advisor agreements, and supplier contracts. Catch the dilutive bits before signing day.",
    examples: [
      "SAFE and convertible note agreements",
      "Advisor and contractor equity grants",
      "Supplier and infrastructure contracts",
      "Term sheets",
    ],
    flag: {
      severity: "red",
      title: "Typical red flag",
      body:
        "Discount + valuation cap stacking on a SAFE in a way that compounds dilution at the next round.",
    },
  },
  {
    id: "creators",
    title: "Creators",
    pitch:
      "Brand deals look like marketing. They're contracts. Know what you're giving up before you post.",
    examples: [
      "Brand sponsorship agreements",
      "Influencer marketing contracts",
      "Talent management agreements",
      "Licensing and merchandise deals",
    ],
    flag: {
      severity: "orange",
      title: "Typical warning",
      body:
        'Exclusivity windows ("no competing brands for 12 months") that exceed the campaign duration. Negotiate down hard.',
    },
  },
];

const SEV_LABEL: Record<Severity, string> = {
  red: "RED FLAG",
  orange: "ORANGE WARNING",
  yellow: "YELLOW NOTE",
  green: "GREEN-FLAGGED",
};

export default function UseCasesPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div style={{ maxWidth: 760 }}>
            <span className="gf-label">// USE CASES</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              Built for the people
              <br />
              <span style={{ color: "var(--green-500)" }}>
                who sign without lawyers.
              </span>
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              We didn&apos;t build Green Flagged for in-house legal teams. We
              built it for the freelance designer, the indie founder, the
              creator with an inbox full of brand deals — anyone who signs
              contracts and can&apos;t afford to send each one to counsel.
            </p>
          </div>
        </div>
      </section>

      {CASES.map((c, i) => (
        <section
          key={c.id}
          id={c.id}
          className={"section " + (i % 2 === 1 ? "section--sunken" : "")}
        >
          <div className="container">
            <div className="section__heading" style={{ marginBottom: 40 }}>
              <span className="gf-label section__eyebrow">
                // 0{i + 1}  {c.title}
              </span>
              <h2 className="gf-h2 section__lead">For {c.title.toLowerCase()}.</h2>
              <p className="gf-body section__sub">{c.pitch}</p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 64,
              }}
              className="usecase__grid"
            >
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {c.examples.map((ex) => (
                  <li
                    key={ex}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 14,
                      color: "var(--fg-1)",
                    }}
                  >
                    <span className="trust-dot" />
                    {ex}
                  </li>
                ))}
              </ul>
              <div className="gf-card">
                <span className={"gf-tag sev-" + c.flag.severity}>
                  {SEV_LABEL[c.flag.severity]}
                </span>
                <h3 className="gf-h4" style={{ marginTop: 16 }}>
                  {c.flag.title}
                </h3>
                <p className="gf-body-sm" style={{ marginTop: 12 }}>
                  {c.flag.body}
                </p>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
