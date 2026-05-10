"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { TIERS } from "@/content/pricing";
import { cn } from "@/lib/cn";

export function PricingToggle() {
  const [yearly, setYearly] = React.useState(false);

  return (
    <div className="w-full">
      <div className="mb-12 flex items-center justify-center">
        <div className="glass-card inline-flex items-center gap-1 p-1">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={cn(
              "text-label px-4 py-2 transition-colors",
              !yearly
                ? "bg-green-200 text-green-950"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={cn(
              "text-label inline-flex items-center gap-2 px-4 py-2 transition-colors",
              yearly
                ? "bg-green-200 text-green-950"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            Yearly
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px]",
                yearly ? "bg-green-950 text-green-200" : "bg-green-500/15 text-green-300",
              )}
            >
              2 months free
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => {
          const billing = yearly ? tier.yearly : tier.monthly;
          return (
            <GlassCard
              key={tier.id}
              padded="lg"
              strong={tier.highlighted}
              className={cn(
                "relative gap-6",
                tier.highlighted && "border-green-300/40",
              )}
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
                  €{billing.amount}
                </span>
                <span className="text-sm text-text-secondary">
                  {billing.period}
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
          );
        })}
      </div>
    </div>
  );
}
