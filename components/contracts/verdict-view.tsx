import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Redline, TaxonomyEntry } from "@/lib/ai/review";
import type { VerdictSeverity } from "@/lib/supabase/types";
import { FixButton } from "./fix-button";
import {
  SEVERITY_LABEL,
  SEVERITY_SHORT,
  TAXONOMY_LABELS,
} from "./severity";

type VerdictViewProps = {
  contractId: string;
  title: string;
  severity: VerdictSeverity;
  reviewedAt: string;
  verdictMd: string;
  taxonomy: Record<string, TaxonomyEntry>;
  redlines: Redline[];
};

const SEV_RANK: Record<VerdictSeverity, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
  green: 3,
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function VerdictView({
  contractId,
  title,
  severity,
  reviewedAt,
  verdictMd,
  taxonomy,
  redlines,
}: VerdictViewProps) {
  const taxonomyEntries = Object.entries(TAXONOMY_LABELS).map(
    ([key, label]) => {
      const entry = taxonomy[key];
      return { key, label, entry };
    }
  );

  const sortedRedlines = [...redlines].sort(
    (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity],
  );

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <header
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <span className="gf-label">// VERDICT</span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={`/api/contracts/${contractId}/report/pdf`}
                  className="gf-btn-link"
                  prefetch={false}
                >
                  Download report (PDF) <span className="arrow">→</span>
                </Link>
                <FixButton
                  contractId={contractId}
                  disabled={redlines.length === 0}
                />
              </div>
            </div>
            <h1 className="gf-h1" style={{ marginBottom: 4 }}>
              {title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span className={`gf-tag sev-${severity}`}>
                {SEVERITY_LABEL[severity]}
              </span>
              <span
                className="gf-mono-sm"
                style={{ color: "var(--fg-3)" }}
              >
                Reviewed on {formatDate(reviewedAt)}
              </span>
            </div>
          </header>

          <div className="scan-result-grid">
            <div
              className="gf-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <span className="gf-label">// SUMMARY</span>
              <div className="legal-body">
                <ReactMarkdown>{verdictMd}</ReactMarkdown>
              </div>
            </div>

            <div
              className="gf-card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <span className="gf-label">// CLAUSES SCANNED</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {taxonomyEntries.map(({ key, label, entry }, i) => {
                  const sev =
                    entry?.severity ?? ("green" as VerdictSeverity);
                  const presentLabel = !entry
                    ? "—"
                    : entry.present
                    ? SEVERITY_SHORT[sev]
                    : "ABSENT";
                  const isLast = i === taxonomyEntries.length - 1;
                  return (
                    <div
                      key={key}
                      className="gf-specrow"
                      style={isLast ? { borderBottom: "none" } : undefined}
                    >
                      <span className="key">{label}</span>
                      <span className="dots" />
                      <span className="val" style={{ display: "flex" }}>
                        <span className={`gf-tag sev-${sev}`}>
                          {presentLabel}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
              {taxonomyEntries.some(({ entry }) => entry?.summary) ? (
                <details style={{ marginTop: 8 }}>
                  <summary
                    className="gf-label"
                    style={{
                      cursor: "pointer",
                      color: "var(--fg-3)",
                      paddingBottom: 8,
                    }}
                  >
                    // CLAUSE NOTES
                  </summary>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      paddingTop: 4,
                    }}
                  >
                    {taxonomyEntries
                      .filter(({ entry }) => entry?.summary)
                      .map(({ key, label, entry }) => (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <span
                            className="gf-mono-sm"
                            style={{ color: "var(--fg-3)" }}
                          >
                            // {label.toUpperCase()}
                          </span>
                          <p
                            className="gf-body-sm"
                            style={{ color: "var(--fg-2)", margin: 0 }}
                          >
                            {entry!.summary}
                          </p>
                        </div>
                      ))}
                  </div>
                </details>
              ) : null}
            </div>
          </div>

          <div
            className="gf-card"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span className="gf-label">// SUGGESTED REDLINES</span>
              <span
                className="gf-mono-sm"
                style={{ color: "var(--fg-3)" }}
              >
                {sortedRedlines.length} item{sortedRedlines.length === 1 ? "" : "s"}
              </span>
            </div>

            {sortedRedlines.length === 0 ? (
              <p
                className="gf-body"
                style={{ color: "var(--fg-2)", margin: 0 }}
              >
                No redlines suggested — the reviewer didn't find any clauses
                that need rewording.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {sortedRedlines.map((rl, idx) => (
                  <div
                    key={idx}
                    className="gf-frame"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      padding: 20,
                    }}
                  >
                    <span className="gf-frame-bl" />
                    <span className="gf-frame-br" />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span className={`gf-tag sev-${rl.severity}`}>
                        {SEVERITY_SHORT[rl.severity]} · REDLINE {idx + 1}
                      </span>
                    </div>
                    <RedlineBlock label="EXCERPT">
                      <em style={{ color: "var(--fg-2)" }}>
                        “{rl.clause_excerpt}”
                      </em>
                    </RedlineBlock>
                    <RedlineBlock label="ISSUE">
                      <span style={{ color: "var(--fg-1)" }}>{rl.issue}</span>
                    </RedlineBlock>
                    <RedlineBlock label="SUGGEST">
                      <span style={{ color: "var(--fg-1)" }}>
                        {rl.suggestion}
                      </span>
                    </RedlineBlock>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link href="/dashboard" className="gf-btn-link">
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function RedlineBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 4 }}
    >
      <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
        // {label}
      </span>
      <div className="gf-body" style={{ margin: 0 }}>
        {children}
      </div>
    </div>
  );
}
