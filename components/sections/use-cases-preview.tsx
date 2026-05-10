import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";

const CASES = [
  {
    id: "freelancers",
    title: "Freelancers",
    body: "Signing client SOWs? Catch IP grabs and unbounded scope before you commit.",
  },
  {
    id: "agencies",
    title: "Agencies",
    body: "Vendor and partnership contracts at scale. Custom risk profiles per team.",
  },
  {
    id: "founders",
    title: "Founders",
    body: "SAFEs, advisor agreements, supplier deals. Plain-English explanations of the dilutive bits.",
  },
  {
    id: "creators",
    title: "Creators",
    body: "Brand deal contracts. Know exactly what you're giving up before you post.",
  },
];

export function UseCasesPreview() {
  return (
    <Section id="use-cases" eyebrow="Built for" pad="lg">
      <Container>
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-display-sm max-w-2xl font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            Who reads it<br />
            <span className="text-green-300">before signing.</span>
          </h2>
          <Link
            href="/use-cases"
            className="text-label inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-green-300"
          >
            See all use cases
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CASES.map((c) => (
            <Link
              key={c.id}
              href={`/use-cases#${c.id}`}
              className="group block"
            >
              <GlassCard
                padded="md"
                className="h-full justify-between gap-6 transition-colors duration-200 group-hover:border-green-300/40"
              >
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.01em]">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-text-secondary">
                    {c.body}
                  </p>
                </div>
                <ArrowUpRight className="size-5 text-green-300 transition-transform duration-200 group-hover:-translate-y-1 group-hover:translate-x-1" />
              </GlassCard>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
