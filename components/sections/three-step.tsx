import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";

const STEPS = [
  {
    n: "01",
    title: "Drop your PDF",
    body: "Drag in a contract, paste text, or upload a DOCX. We accept anything you'd sign.",
  },
  {
    n: "02",
    title: "AI ranks every clause",
    body: "Each clause is scored for risk. Eight categories, four severity levels, plain English throughout.",
  },
  {
    n: "03",
    title: "Get your verdict",
    body: "Green-flagged means safe. Anything else comes with an explanation and a suggested rewrite.",
  },
];

export function ThreeStep() {
  return (
    <Section id="how" eyebrow="How it works" pad="lg">
      <Container>
        <h2 className="text-display-sm max-w-3xl mb-16 font-bold uppercase leading-[0.95] tracking-[-0.03em]">
          Three steps.<br />
          <span className="text-green-300">No legalese.</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <GlassCard key={step.n} padded="lg" className="gap-6">
              <div className="text-label text-green-300">{step.n}</div>
              <h3 className="text-2xl font-bold leading-[1.1] tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="text-sm leading-6 text-text-secondary">
                {step.body}
              </p>
            </GlassCard>
          ))}
        </div>
      </Container>
    </Section>
  );
}
