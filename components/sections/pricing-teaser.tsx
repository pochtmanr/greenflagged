import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/content/pricing";

export function PricingTeaser() {
  return (
    <Section id="pricing" eyebrow="Pricing" pad="lg">
      <Container>
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 className="text-display-sm max-w-2xl font-bold uppercase leading-[0.95] tracking-[-0.03em]">
            One coffee.<br />
            <span className="text-green-300">Two hundred saved.</span>
          </h2>
          <Link
            href="/pricing"
            className="text-label inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-green-300"
          >
            Full comparison
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <GlassCard
              key={tier.id}
              padded="lg"
              strong={tier.highlighted}
              className={`relative gap-6 ${tier.highlighted ? "border-green-300/40" : ""}`}
            >
              {tier.highlighted ? (
                <span className="absolute -top-3 left-6 rounded-full bg-green-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3px] text-green-950">
                  Most popular
                </span>
              ) : null}
              <div>
                <h3 className="text-xl font-semibold uppercase tracking-[-0.01em]">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {tier.blurb}
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-[-0.04em]">
                  €{tier.monthly.amount}
                </span>
                <span className="text-sm text-text-secondary">
                  {tier.monthly.period}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm leading-6 text-text-primary"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-green-300" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant="light"
                size={tier.highlighted ? "lg" : "md"}
                className="mt-auto self-start"
              >
                <Link href={tier.ctaHref}>
                  {tier.cta}
                  <span aria-hidden className="btn-arrow transition-transform">→</span>
                </Link>
              </Button>
            </GlassCard>
          ))}
        </div>
      </Container>
    </Section>
  );
}
