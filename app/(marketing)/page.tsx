import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { ThreeStep } from "@/components/marketing/three-step";
import { SampleVerdict } from "@/components/marketing/sample-verdict";
import { ArtInterlude } from "@/components/marketing/art-interlude";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { CTA } from "@/components/marketing/cta";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  SoftwareApplicationSchema,
  FAQPageSchema,
} from "@/lib/seo/json-ld";
import { FAQ as FAQ_ITEMS } from "@/content/faq";

export const metadata: Metadata = {
  title: {
    absolute: "Green Flagged — Check any contract online with AI",
  },
  description:
    "Check any contract online in minutes. AI-powered clause-by-clause review with severity-ranked red flags. Free, no account needed.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Green Flagged — Check any contract online with AI",
    description:
      "Check any contract online in minutes. AI-powered clause-by-clause review with severity-ranked red flags. Free, no account needed.",
  },
};

export default async function HomePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  return (
    <>
      <SoftwareApplicationSchema />
      <FAQPageSchema items={FAQ_ITEMS} />
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
