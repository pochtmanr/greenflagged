import { SectionHeading } from "@/components/marketing/section-heading";

type Severity = "red" | "orange" | "yellow" | "green";

const ANNOTATIONS: Array<{ sev: Severity; clause: string; note: string }> = [
  {
    sev: "red",
    clause:
      "All intellectual property, including pre-existing work, shall transfer to Client upon delivery.",
    note:
      "Strips your prior IP. Insert a carve-out for tools and templates you created before this engagement.",
  },
  {
    sev: "orange",
    clause:
      "Client may terminate this Agreement for convenience with seven (7) days' written notice.",
    note:
      "Negotiate a kill fee (50–100% of remaining contract value) or extend notice to 30 days.",
  },
  {
    sev: "yellow",
    clause: "Payment due Net 60 from receipt of acceptance.",
    note: "Industry standard is Net 30. Push for it, or add a 1.5% monthly late fee.",
  },
  {
    sev: "green",
    clause: "Either party may terminate immediately for material breach.",
    note: "Symmetrical and fair. No changes needed.",
  },
];

const SEV_LABEL: Record<Severity, string> = {
  red: "RED FLAG",
  orange: "ORANGE WARNING",
  yellow: "YELLOW NOTE",
  green: "GREEN-FLAGGED",
};

const SEV_SECTION = [
  "§4.2 IP",
  "§7.1 TERMINATION",
  "§3.4 PAYMENT",
  "§7.2 BREACH",
];

export function SampleVerdict() {
  return (
    <section id="sample" className="section">
      <div className="container">
        <SectionHeading
          eyebrow="// 02  Sample verdict"
          lead="This is what you get."
          sub="Every clause, ranked. Every risk, explained. Every fix, suggested. The four-color scale is the same one a senior contracts lawyer uses — just faster, and twenty euros instead of two hundred."
        />

        <div className="verdict">
          <div className="verdict__doc gf-frame">
            <span className="gf-frame-bl" />
            <span className="gf-frame-br" />
            <div className="verdict__doc-head">
              <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
                Freelance_Agreement_2026.pdf
              </span>
              <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
                pages 1–4 of 12
              </span>
            </div>
            <div className="verdict__clauses">
              {ANNOTATIONS.map((a, i) => (
                <p key={i} className={"verdict__clause v-" + a.sev}>
                  <span className="verdict__sec">{SEV_SECTION[i]}</span>
                  {a.clause}
                </p>
              ))}
            </div>
          </div>

          <div className="verdict__notes">
            {ANNOTATIONS.map((a, i) => (
              <div key={i} className="gf-card verdict__note">
                <span className={"gf-tag sev-" + a.sev}>{SEV_LABEL[a.sev]}</span>
                <p
                  className="gf-mono"
                  style={{ color: "var(--fg-1)", margin: "10px 0 6px" }}
                >
                  &ldquo;{a.clause}&rdquo;
                </p>
                <p className="gf-body-sm">{a.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="verdict-final">
          <div>
            <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
              // FINAL VERDICT
            </span>
            <h3 className="gf-h2" style={{ marginTop: 8 }}>
              Green-flagged after 4 revisions.
            </h3>
          </div>
          <p
            className="gf-body"
            style={{ maxWidth: 360, color: "var(--fg-1)" }}
          >
            &ldquo;Saved a freelancer in Berlin €18k on a brand deal they were
            about to sign blind. The IP transfer clause alone would have wiped
            out their portfolio.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
