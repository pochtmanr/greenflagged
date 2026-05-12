import * as React from "react";

type LegalPageProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <section className="section" style={{ paddingTop: 144 }}>
      <div className="container">
        <div style={{ maxWidth: 768, marginInline: "auto" }}>
          <span className="gf-label">// LEGAL</span>
          <h1 className="gf-h1" style={{ marginTop: 14 }}>
            {title}
          </h1>
          <p
            className="gf-mono-sm"
            style={{ marginTop: 14, color: "var(--fg-3)" }}
          >
            Last updated: {updated}
          </p>

          <div
            className="gf-card"
            style={{
              marginTop: 48,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              lineHeight: 1.7,
            }}
          >
            <div className="legal-body">{children}</div>
          </div>

          <p
            className="gf-mono-sm"
            style={{ marginTop: 48, color: "var(--fg-3)" }}
          >
            This is placeholder content for launch. Final wording is pending
            review by counsel. For questions: hello@greenflagged.app.
          </p>
        </div>
      </div>
    </section>
  );
}
