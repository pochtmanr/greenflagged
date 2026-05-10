import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { PricingToggle } from "@/components/sections/pricing-toggle";
import { Faq } from "@/components/sections/faq";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Pay €9 once or subscribe for unlimited contract reviews from €15/month. Cancel any time.",
};

export default function PricingPage() {
  return (
    <>
      <Section pad="lg">
        <Container>
          <div className="mb-16 max-w-3xl">
            <span className="text-label text-green-300">Pricing</span>
            <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
              One coffee.<br />
              <span className="text-green-300">Two hundred saved.</span>
            </h1>
            <p className="mt-6 text-base leading-7 text-text-secondary">
              Start with one scan. Subscribe when you sign contracts often.
              Cancel any time. Annual plans get two months free.
            </p>
          </div>
          <PricingToggle />
          <p className="mt-12 text-center text-xs text-text-secondary">
            Prices shown in EUR. VAT applied at checkout for EU customers. We
            offer a 14-day full refund on annual plans.
          </p>
        </Container>
      </Section>
      <Faq />
    </>
  );
}
