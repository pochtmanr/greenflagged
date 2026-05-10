import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { MaskedWordReveal } from "@/components/brand/masked-word-reveal";
import { HeroDropZone } from "@/components/sections/hero-drop-zone";

export function Hero() {
  return (
    <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-4rem] -z-10 h-[22rem] md:h-[26rem] bg-[url('/landing.avif')] bg-cover bg-bottom bg-no-repeat opacity-75 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,0.9)_30%,rgba(0,0,0,0.45)_60%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,0.9)_30%,rgba(0,0,0,0.45)_60%,transparent_85%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-4rem] -z-10 h-[22rem] md:h-[26rem] bg-[linear-gradient(to_bottom,rgba(18,18,18,0)_0%,rgba(18,18,18,0.35)_55%,var(--bg)_95%)]"
      />
      <Container>
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr,1fr] lg:gap-16">
          <div className="flex flex-col gap-5">
            <span className="text-label inline-flex items-center gap-2 self-start border border-border-glass bg-[var(--bg)] px-4 py-2 text-text-secondary">
              <Sparkles className="size-3.5 text-green-300" />
              AI contract review — free first scan
            </span>

            <MaskedWordReveal as="h1" className="text-display">
              Get your contract green-flagged{" "}
              <span className="text-green-300">before you sign.</span>
            </MaskedWordReveal>

            <p className="max-w-xl text-body text-text-secondary md:text-lg md:leading-8">
              Drop any contract. Our AI scans every clause, ranks the risks,
              and tells you exactly what to push back on — in plain English.
              Free. No account needed.
            </p>

            <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
              <Button asChild size="lg" variant="light">
                <a href="#hero-drop">
                  Scan one free
                  <ArrowRight className="btn-arrow size-4 transition-transform" />
                </a>
              </Button>
              <Button asChild variant="muted" size="lg">
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-text-secondary">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-green-300" />
                Encrypted in transit and at rest
              </li>
              <li className="inline-flex items-center gap-2">
                <Timer className="size-4 text-green-300" />
                Verdict in under 2 minutes
              </li>
              <li className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-green-300" />
                Informational, not legal advice
              </li>
            </ul>
          </div>

          <HeroDropZone />
        </div>
      </Container>
    </section>
  );
}
