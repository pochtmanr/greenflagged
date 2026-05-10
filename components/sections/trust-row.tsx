import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

const STATS = [
  { value: "10k+", label: "Contracts scanned" },
  { value: "92%", label: "Felt more confident signing" },
  { value: "8 min", label: "Average time to verdict" },
];

export function TrustRow() {
  return (
    <Section pad="md">
      <Container>
        <div className="grid gap-12 border-y border-border-glass py-16 md:grid-cols-3 md:gap-0">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={
                i < STATS.length - 1
                  ? "md:border-r md:border-border-glass md:pr-12"
                  : ""
              }
            >
              <div className="text-display-sm font-bold uppercase leading-none tracking-[-0.03em] text-green-300">
                {s.value}
              </div>
              <div className="mt-4 text-label text-text-secondary">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
