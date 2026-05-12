import type { Metadata } from "next";
import { ThreeStep } from "@/components/marketing/three-step";
import { ClauseGrid } from "@/components/marketing/clause-grid";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Drop a contract, get a clause-by-clause verdict. Eight risk categories, four severity levels, plain English explanations.",
};

export default function HowItWorksPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div style={{ maxWidth: 760 }}>
            <span className="gf-label">// HOW IT WORKS</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              From PDF to verdict
              <br />
              <span style={{ color: "var(--green-500)" }}>
                in under two minutes.
              </span>
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              The same eight risk dimensions a senior contracts lawyer checks.
              The same four-color severity scale. Just faster, in plain English,
              and without the hourly bill.
            </p>
          </div>
        </div>
      </section>

      <ThreeStep />
      <ClauseGrid />

      <section className="section">
        <div className="container">
          <div className="gf-frame" style={{ maxWidth: 760 }}>
            <span className="gf-frame-bl" />
            <span className="gf-frame-br" />
            <span className="gf-label">// what we don&apos;t do</span>
            <h2 className="gf-h2" style={{ marginTop: 16 }}>
              Not a substitute for a lawyer.
            </h2>
            <p className="gf-body" style={{ marginTop: 16 }}>
              Green Flagged is informational. It does not create an
              attorney-client relationship. It cannot represent you, file
              anything on your behalf, or advise on jurisdiction-specific case
              law. Treat every verdict as a strong first read, then take it to a
              licensed attorney for any decision that matters — a deal worth
              more than a few weeks of your time, a contract with personal
              liability, or anything involving equity or IP transfer to a party
              you don&apos;t know.
            </p>
            <p className="gf-body" style={{ marginTop: 16 }}>
              The AI also makes mistakes. We flag low-confidence findings
              explicitly, but you should always sanity-check the verdict against
              your own reading of the contract.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
