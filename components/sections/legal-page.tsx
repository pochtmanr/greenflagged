import * as React from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";

type LegalPageProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <Section pad="lg">
      <Container>
        <div className="mx-auto max-w-3xl">
          <span className="text-label text-green-300">Legal</span>
          <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-4 text-xs text-text-secondary">Last updated: {updated}</p>

          <GlassCard padded="lg" className="mt-12 gap-6 text-sm leading-7 text-text-secondary">
            {children}
          </GlassCard>

          <p className="mt-12 text-xs text-text-secondary">
            This is placeholder content for launch. Final wording is pending
            review by counsel. For questions: hello@greenflagged.app.
          </p>
        </div>
      </Container>
    </Section>
  );
}
