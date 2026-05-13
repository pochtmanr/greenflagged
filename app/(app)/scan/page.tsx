import type { Metadata } from "next";
import Link from "next/link";
import { ScanForm } from "@/components/scan/scan-form";

export const metadata: Metadata = {
  title: "Scan a contract",
  description:
    "Drop a PDF, DOCX, or paste contract text. Verdict + clause-by-clause breakdown in under 30 seconds.",
  robots: { index: false, follow: false },
};

export default function ScanPage() {
  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            maxWidth: 880,
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label">// SCAN</span>
            <h1 className="gf-h1">Drop a contract. Get a verdict.</h1>
            <p
              className="gf-body"
              style={{ color: "var(--fg-2)", maxWidth: 640 }}
            >
              Upload a PDF or DOCX, or paste the text. Our reviewer checks
              for IP grabs, hostile termination, runaway liability, and the
              other quiet ways contracts go sideways — then suggests redlines
              in plain English.
            </p>
          </div>

          <ScanForm />

          <div
            className="gf-mono-sm"
            style={{ color: "var(--fg-3)", textAlign: "center" }}
          >
            <Link href="/dashboard" className="gf-btn-link">
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
