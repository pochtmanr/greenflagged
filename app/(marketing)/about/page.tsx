import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";

export const metadata: Metadata = {
  title: "About",
  description:
    "Green Flagged is built by a small independent team and operated by Simnetiq Ltd in the EU.",
};

const PRINCIPLES = [
  {
    label: "Plain English",
    body:
      "Every flag is written the way a smart friend would explain it. No Latin, no fine print, no hedging.",
    tone: "text-green-300",
    dot: "bg-green-400",
  },
  {
    label: "No surprises",
    body:
      "One flat price. No paywalls mid-verdict. No upsells dressed as warnings. The bill is the bill.",
    tone: "text-yellow-300",
    dot: "bg-yellow-300",
  },
  {
    label: "Your file, your file",
    body:
      "Contracts are wiped after the verdict. We never train on your documents. The whole company is GDPR by default.",
    tone: "text-blue-300",
    dot: "bg-blue-300",
  },
  {
    label: "Honest about limits",
    body:
      "We’re fast, cheap, and accurate enough for 90% of contracts. We will tell you when you need a lawyer.",
    tone: "text-red-300",
    dot: "bg-red-300",
  },
];

const STATS = [
  { value: "20€", label: "Per verdict" },
  { value: "<3 min", label: "Median turnaround" },
  { value: "8", label: "Risk categories scored" },
  { value: "EU", label: "Data residency" },
];

export default function AboutPage() {
  return (
    <>
      <Section pad="lg">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr,2fr] lg:gap-16">
            <div>
              <span className="text-label text-green-300">About</span>
              <h1 className="mt-4 text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
                Small team.<br />
                <span className="text-blue-400">Strong opinions.</span>
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
                The product is built and operated by{" "}
                <a
                  href="https://simnetiq.com"
                  className="text-text-primary hover:text-blue-300"
                >
                  Simnetiq Ltd
                </a>
                , a small EU-based studio. We process payments through Paddle,
                which acts as our merchant of record and handles VAT
                compliance for EU customers.
              </p>
              <GlassCard padded="lg" className="gap-3">
                <span className="text-label text-yellow-300">Disclaimer</span>
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

      <Section pad="md" reveal={false}>
        <Container>
          <div className="grid grid-cols-2 gap-px bg-border-glass md:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="bg-[var(--bg)] p-8"
              >
                <div className="text-display-sm leading-none text-text-primary">
                  {s.value}
                </div>
                <div className="mt-3 text-label text-text-secondary">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section pad="lg" eyebrow="What we believe">
        <Container>
          <h2 className="mb-12 max-w-2xl text-display-sm font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            Four <span className="text-blue-400">principles.</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <GlassCard key={p.label} padded="lg" className="gap-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={`size-1.5 rounded-full ${p.dot}`}
                  />
                  <span className={`text-label ${p.tone}`}>{p.label}</span>
                </div>
                <p className="text-sm leading-6 text-text-secondary">
                  {p.body}
                </p>
              </GlassCard>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
