import { Hero } from "@/components/sections/hero";
import { ThreeStep } from "@/components/sections/three-step";
import { SampleVerdict } from "@/components/sections/sample-verdict";
import { ClauseGrid } from "@/components/sections/clause-grid";
import { TrustRow } from "@/components/sections/trust-row";
import { UseCasesPreview } from "@/components/sections/use-cases-preview";
import { PricingTeaser } from "@/components/sections/pricing-teaser";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ThreeStep />
      <SampleVerdict />
      <ClauseGrid />
      <TrustRow />
      <UseCasesPreview />
      <PricingTeaser />
      <Faq />
      <FinalCta />
    </>
  );
}
