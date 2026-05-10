import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Green Flagged is built by a small independent team and operated by Holylabs Ltd in the EU.",
};

export default function AboutPage() {
  return (
    <Section pad="lg">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr,2fr] lg:gap-16">
          <div>
            <span className="text-label text-green-300">About</span>
            <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
              Small team.<br />
              <span className="text-green-300">Strong opinions.</span>
            </h1>
          </div>
          <div className="flex flex-col gap-8 text-base leading-7 text-text-secondary">
            <p>
              Green Flagged exists because the cost of bad contracts falls on
              the people least equipped to read them. Freelancers, indie
              founders, and creators sign agreements every week that, on
              re-reading, contain clauses they&apos;d never have agreed to.
              Lawyers are expensive. Templates are generic. Most people sign
              anyway.
            </p>
            <p>
              We&apos;re building the tool we wished we had when we were
              signing our first client contracts: a fast, plain-English read
              that catches the obvious problems and flags the ones worth
              negotiating, without pretending to be a lawyer.
            </p>
            <p>
              The product is operated by Holylabs Ltd, based in the EU. We
              process payments through Paddle, which acts as our merchant of
              record and handles VAT compliance for EU customers.
            </p>
            <GlassCard padded="lg" className="gap-3">
              <span className="text-label text-green-300">Disclaimer</span>
              <p className="text-sm leading-6 text-text-secondary">
                Green Flagged is informational and not a substitute for advice
                from a licensed attorney. Reviews do not create an
                attorney-client relationship. For decisions that matter, talk
                to a lawyer in your jurisdiction.
              </p>
            </GlassCard>
          </div>
        </div>
      </Container>
    </Section>
  );
}
