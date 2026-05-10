import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";
import { VerdictBadge } from "@/components/brand/verdict-badge";

export const metadata: Metadata = {
  title: "Use cases",
  description:
    "Built for freelancers, agencies, founders, and creators. Get the verdict before you sign anything.",
};

const CASES = [
  {
    id: "freelancers",
    title: "Freelancers",
    pitch:
      "You sign more contracts than your last lawyer ever did. We give you the same vocabulary they use.",
    examples: [
      "Web/design services agreements",
      "Brand engagements and SOWs",
      "Consulting retainers",
      "Subcontractor pass-through deals",
    ],
    flag: {
      severity: "red" as const,
      title: "Typical red flag",
      body: '"All IP, including pre-existing work, transfers to Client on delivery." — Insert a prior-work carve-out or refuse.',
    },
  },
  {
    id: "agencies",
    title: "Agencies",
    pitch:
      "Vendor, partnership, and reseller contracts pile up. Run them all through one consistent risk framework.",
    examples: [
      "Vendor and supplier agreements",
      "Reseller and partnership contracts",
      "Independent contractor agreements",
      "Master services agreements + SOWs",
    ],
    flag: {
      severity: "orange" as const,
      title: "Typical warning",
      body: 'Most-favored-nation pricing clauses that auto-discount your rate. Cap them by term or scope.',
    },
  },
  {
    id: "founders",
    title: "Founders",
    pitch:
      "SAFEs, advisor agreements, and supplier contracts. Catch the dilutive bits before signing day.",
    examples: [
      "SAFE and convertible note agreements",
      "Advisor and contractor equity grants",
      "Supplier and infrastructure contracts",
      "Term sheets",
    ],
    flag: {
      severity: "red" as const,
      title: "Typical red flag",
      body: "Discount + valuation cap stacking on a SAFE in a way that compounds dilution at the next round.",
    },
  },
  {
    id: "creators",
    title: "Creators",
    pitch:
      "Brand deals look like marketing. They're contracts. Know what you're giving up before you post.",
    examples: [
      "Brand sponsorship agreements",
      "Influencer marketing contracts",
      "Talent management agreements",
      "Licensing and merchandise deals",
    ],
    flag: {
      severity: "orange" as const,
      title: "Typical warning",
      body: 'Exclusivity windows ("no competing brands for 12 months") that exceed the campaign duration. Negotiate down hard.',
    },
  },
];

export default function UseCasesPage() {
  return (
    <>
      <Section pad="lg">
        <Container>
          <div className="max-w-3xl">
            <span className="text-label text-green-300">Use cases</span>
            <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
              Built for the people<br />
              <span className="text-green-300">who sign without lawyers.</span>
            </h1>
            <p className="mt-6 text-base leading-7 text-text-secondary">
              We didn&apos;t build Green Flagged for in-house legal teams.
              We built it for the freelance designer, the indie founder, the
              creator with an inbox full of brand deals — anyone who signs
              contracts and can&apos;t afford to send each one to counsel.
            </p>
          </div>
        </Container>
      </Section>

      {CASES.map((c, i) => (
        <Section
          key={c.id}
          id={c.id}
          pad="lg"
          eyebrow={`0${i + 1} · ${c.title}`}
          className={i % 2 === 1 ? "bg-[rgba(255,255,255,0.02)]" : ""}
        >
          <Container>
            <div className="grid gap-12 lg:grid-cols-[1fr,1fr] lg:gap-16">
              <div className="flex flex-col gap-6">
                <h2 className="text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
                  For {c.title.toLowerCase()}.
                </h2>
                <p className="text-base leading-7 text-text-secondary">
                  {c.pitch}
                </p>
                <ul className="mt-2 flex flex-col gap-3">
                  {c.examples.map((ex) => (
                    <li
                      key={ex}
                      className="flex items-center gap-3 text-sm text-text-primary"
                    >
                      <span className="size-1.5 rounded-full bg-green-500" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
              <GlassCard padded="lg" className="gap-4">
                <VerdictBadge severity={c.flag.severity} />
                <h3 className="text-base font-semibold uppercase tracking-[0.02em]">
                  {c.flag.title}
                </h3>
                <p className="text-sm leading-6 text-text-secondary">
                  {c.flag.body}
                </p>
              </GlassCard>
            </div>
          </Container>
        </Section>
      ))}
    </>
  );
}
