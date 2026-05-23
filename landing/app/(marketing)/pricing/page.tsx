import type { Metadata } from "next";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { getSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing — Green Flagged",
  description:
    "Free, Pay as you go ($3 per contract), or Standard ($25/month, 10 contracts). No yearly lock-in, no surprises.",
};

const PRICING_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Green Flagged",
  description:
    "AI contract review and drafting. Free, Pay as you go, or Standard tier.",
  brand: { "@type": "Brand", name: "Green Flagged" },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0.00",
      priceCurrency: "USD",
      description: "1 contract per month.",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Pay as you go",
      price: "3.00",
      priceCurrency: "USD",
      description: "Per contract, no commitment, valid 90 days.",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Standard",
      price: "25.00",
      priceCurrency: "USD",
      description:
        "10 contracts per month, each extra at $3.00. Monthly billing.",
      availability: "https://schema.org/InStock",
    },
  ],
};

export default async function PricingPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRICING_JSONLD) }}
      />
      <section className="section" style={{ paddingTop: 144, paddingBottom: 24 }}>
        <div className="container">
          <div style={{ maxWidth: 760 }}>
            <span className="gf-label">// PRICING</span>
            <h1 className="gf-h1" style={{ marginTop: 14 }}>
              Simple,{" "}
              <span style={{ color: "var(--green-500)" }}>contract-based</span>{" "}
              pricing.
            </h1>
            <p className="gf-body" style={{ marginTop: 24, fontSize: 17 }}>
              Pay for what you scan or draft. Standard is best for ongoing work
              — Pay as you go is best for one-offs. No yearly lock-in.
            </p>
          </div>
        </div>
      </section>

      <Pricing signedIn={signedIn} hideHeading />

      <section className="section--thin">
        <div className="container">
          <p
            className="gf-mono-sm"
            style={{ textAlign: "center", color: "var(--fg-3)" }}
          >
            Prices shown in USD. Standard auto-bills $3 per contract over the
            monthly cap. Cancel any time.
          </p>
        </div>
      </section>

      <FAQ />
    </>
  );
}
