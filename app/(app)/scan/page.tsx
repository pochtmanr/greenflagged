import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scan",
  description: "Scan a contract for redlines and severity.",
  robots: { index: false, follow: false },
};

export default function ScanPlaceholderPage() {
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
          <span className="gf-label">// SCAN</span>
          <h1 className="gf-h1">Scan view ships in Phase 3.</h1>
          <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="gf-body" style={{ color: "var(--fg-2)" }}>
              The scanner — upload, AI taxonomy pass, severity verdict, and
              redlines — is coming in the next phase. Your account is ready,
              your usage limits are set, and the storage bucket is wired.
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
