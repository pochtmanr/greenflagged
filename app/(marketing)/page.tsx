import { Hero } from "@/components/marketing/hero";
import { ThreeStep } from "@/components/marketing/three-step";
import { SampleVerdict } from "@/components/marketing/sample-verdict";
import { ArtInterlude } from "@/components/marketing/art-interlude";
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
      <ThreeStep />
      <SampleVerdict />
      <ArtInterlude />
      <Pricing signedIn={signedIn} />
      <FAQ />
      <CTA />
    </>
  );
}
