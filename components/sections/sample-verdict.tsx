import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";
import { VerdictBadge, type Severity } from "@/components/brand/verdict-badge";

const ANNOTATIONS: { severity: Severity; clause: string; note: string }[] = [
  {
    severity: "red",
    clause:
      "All intellectual property, including pre-existing work, shall transfer to Client upon delivery.",
    note: "Strips your prior IP. Insert a carve-out for tools and templates you created before this engagement.",
  },
  {
    severity: "orange",
    clause:
      "Client may terminate this Agreement for convenience with seven (7) days' written notice.",
    note: "Negotiate a kill fee (50–100% of remaining contract value) or extend notice to 30 days.",
  },
  {
    severity: "yellow",
    clause: "Payment due Net 60 from receipt of acceptance.",
    note: "Industry standard is Net 30. Push for it, or add a 1.5% monthly late fee.",
  },
  {
    severity: "green",
    clause: "Either party may terminate immediately for material breach.",
    note: "Symmetrical and fair. No changes needed.",
  },
];

export function SampleVerdict() {
  return (
    <Section id="sample" eyebrow="Sample verdict" pad="lg">
      <Container>
        <div className="mb-16 max-w-3xl">
          <h2 className="text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            This is what you get.
          </h2>
          <p className="mt-6 text-base leading-7 text-text-secondary">
            Every clause, ranked. Every risk, explained. Every fix, suggested.
            The four-color scale is the same one a senior contracts lawyer uses
            — just faster, and twenty euros instead of two hundred.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
          <GlassCard padded="lg" className="gap-6">
            <div className="flex items-center gap-3 text-label text-text-secondary">
              <span className="size-2 rounded-full bg-green-500" />
              Freelance_Agreement_2026.pdf
              <span className="ml-auto">Pages 1–4 of 12</span>
            </div>
            <div className="space-y-6 text-[13px] leading-6 text-text-primary/90 font-mono">
              <p className="border-l-2 border-[var(--severity-red)] pl-4">
                <span className="text-text-secondary">§4.2 IP — </span>
                All intellectual property, including pre-existing work, shall
                transfer to Client upon delivery.
              </p>
              <p className="border-l-2 border-[var(--severity-orange)] pl-4">
                <span className="text-text-secondary">§7.1 Termination — </span>
                Client may terminate this Agreement for convenience with seven
                (7) days&apos; written notice.
              </p>
              <p className="border-l-2 border-[var(--severity-yellow)] pl-4">
                <span className="text-text-secondary">§3.4 Payment — </span>
                Payment due Net 60 from receipt of acceptance.
              </p>
              <p className="border-l-2 border-[var(--severity-green)] pl-4">
                <span className="text-text-secondary">§7.2 Breach — </span>
                Either party may terminate immediately for material breach.
              </p>
            </div>
          </GlassCard>

          <div className="flex flex-col gap-4">
            {ANNOTATIONS.map((a, i) => (
              <GlassCard key={i} padded="md" className="gap-3">
                <VerdictBadge severity={a.severity} />
                <p className="text-sm leading-6 text-text-primary">
                  &ldquo;{a.clause}&rdquo;
                </p>
                <p className="text-sm leading-6 text-text-secondary">
                  {a.note}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </Container>

      <div className="mt-24 bg-green-100 py-20 text-green-950">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="text-label">Final verdict</div>
              <p className="mt-4 text-display-sm">
                Green-flagged after 4 revisions.
              </p>
            </div>
            <p className="max-w-md text-body text-green-950/70">
              &ldquo;Saved a freelancer in Berlin €18k on a brand deal they
              were about to sign blind. The IP transfer clause alone would have
              wiped out their portfolio.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
