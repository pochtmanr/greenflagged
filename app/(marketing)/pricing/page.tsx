import type { Metadata } from "next";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay €9 once or subscribe for unlimited contract reviews from €15/month. Cancel any time.",
};

export default function PricingPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 144 }}>
        <div className="container">
          <div style={{ maxWidth: 760, marginBottom: 56 }}>
            <span className="gf-label">// PRICING</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              One coffee.
              <br />
              <span style={{ color: "var(--green-500)" }}>Two hundred saved.</span>
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              Start with one scan. Subscribe when you sign contracts often.
              Cancel any time. Annual plans get two months free.
            </p>
          </div>
        </div>
      </section>

      <Pricing />

      <section className="section--thin">
        <div className="container">
          <p
            className="gf-mono-sm"
            style={{ textAlign: "center", color: "var(--fg-3)" }}
          >
            Prices shown in EUR. VAT applied at checkout for EU customers. We
            offer a 14-day full refund on annual plans.
          </p>
        </div>
      </section>

      <FAQ />
    </>
  );
}
