import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "New contract",
  description: "Draft a new contract.",
  robots: { index: false, follow: false },
};

export default function NewContractPlaceholderPage() {
  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 640,
          }}
        >
          <span className="gf-label">// DRAFT</span>
          <h1 className="gf-h1">Contract builder ships in Phase 2.</h1>
          <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="gf-body" style={{ color: "var(--fg-2)" }}>
              The drafting flow — template picker, structured Q&amp;A,
              AI-generated draft you can negotiate from — is up next. Your
              account is provisioned and ready.
            </p>
            <Link href="/dashboard" className="gf-btn-link">
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
