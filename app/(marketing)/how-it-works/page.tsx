import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ThreeStep } from "@/components/sections/three-step";
import { ClauseGrid } from "@/components/sections/clause-grid";
import { GlassCard } from "@/components/ui/glass-card";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Drop a contract, get a clause-by-clause verdict. Eight risk categories, four severity levels, plain English explanations.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Section pad="lg">
        <Container>
          <div className="max-w-3xl">
            <span className="text-label text-green-300">How it works</span>
            <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
              From PDF to verdict<br />
              <span className="text-green-300">in under two minutes.</span>
            </h1>
            <p className="mt-6 text-base leading-7 text-text-secondary">
              The same eight risk dimensions a senior contracts lawyer checks.
              The same four-color severity scale. Just faster, in plain
              English, and without the hourly bill.
            </p>
          </div>
        </Container>
      </Section>

      <ThreeStep />
      <ClauseGrid />

      <Section pad="lg" eyebrow="What we don't do">
        <Container>
          <GlassCard padded="lg" className="max-w-3xl gap-6">
            <h2 className="text-2xl font-bold uppercase tracking-[-0.02em]">
              Not a substitute for a lawyer.
            </h2>
            <p className="text-sm leading-6 text-text-secondary">
              Green Flagged is informational. It does not create an
              attorney-client relationship. It cannot represent you, file
              anything on your behalf, or advise on jurisdiction-specific case
              law. Treat every verdict as a strong first read, then take it to
              a licensed attorney for any decision that matters — a deal worth
              more than a few weeks of your time, a contract with personal
              liability, or anything involving equity or IP transfer to a
              party you don&apos;t know.
            </p>
            <p className="text-sm leading-6 text-text-secondary">
              The AI also makes mistakes. We flag low-confidence findings
              explicitly, but you should always sanity-check the verdict
              against your own reading of the contract.
            </p>
          </GlassCard>
        </Container>
      </Section>
    </>
  );
}
