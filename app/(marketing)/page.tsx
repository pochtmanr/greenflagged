import { Hero } from "@/components/marketing/hero";
import { TrustRow } from "@/components/marketing/trust-row";
import { ThreeStep } from "@/components/marketing/three-step";
import { SampleVerdict } from "@/components/marketing/sample-verdict";
import { ClauseGrid } from "@/components/marketing/clause-grid";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { CTA } from "@/components/marketing/cta";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  return (
    <>
      <Hero />
      <TrustRow />
      <ThreeStep />
      <SampleVerdict />
      <ClauseGrid />
      <Pricing signedIn={signedIn} />
      <FAQ />
      <CTA />
    </>
  );
}
