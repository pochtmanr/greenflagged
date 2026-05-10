import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Plain-English breakdowns of the clauses that trip up freelancers, founders, and creators.",
};

const UPCOMING = [
  "10 red flags in freelance contracts (and the language that fixes them)",
  "How to spot an unfair NDA before you sign",
  "SAFEs explained: where founders give up more than they realize",
  "Brand deal exclusivity: what's negotiable and what isn't",
  "The German Werkvertrag vs Dienstvertrag — what changes for freelancers",
];

export default function BlogPage() {
  return (
    <Section pad="lg">
      <Container>
        <div className="max-w-3xl">
          <span className="text-label text-green-300">Blog</span>
          <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            Coming<br />
            <span className="text-green-300">soon.</span>
          </h1>
          <p className="mt-6 text-base leading-7 text-text-secondary">
            We&apos;re writing the kind of contract guides we wish existed when
            we were signing our first ones. Short, specific, in plain English.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {UPCOMING.map((title) => (
            <GlassCard
              key={title}
              padded="md"
              className="h-full justify-between gap-6"
            >
              <span className="text-label text-text-secondary">Coming soon</span>
              <h3 className="text-base font-semibold leading-[1.3] text-text-primary">
                {title}
              </h3>
            </GlassCard>
          ))}
        </div>
      </Container>
    </Section>
  );
}
