import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";
import { CATEGORIES } from "@/content/clauses";

export function ClauseGrid() {
  return (
    <Section id="categories" eyebrow="What we scan" pad="lg">
      <Container>
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-display-sm max-w-2xl font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            Eight categories.<br />
            <span className="text-green-300">Four severity levels.</span>
          </h2>
          <p className="max-w-md text-sm leading-6 text-text-secondary">
            Each clause is scored against the same eight risk dimensions a
            senior contracts lawyer would check.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <GlassCard
                key={cat.id}
                padded="md"
                className="gap-4 transition-colors duration-200 hover:border-green-300/40"
              >
                <Icon className="size-6 text-green-300" strokeWidth={1.5} />
                <h3 className="text-base font-semibold uppercase tracking-[0.04em]">
                  {cat.title}
                </h3>
                <p className="text-xs leading-5 text-text-secondary">
                  {cat.example}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
