import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/layout/container";
import { MaskedWordReveal } from "@/components/brand/masked-word-reveal";
import { SignInForm } from "@/components/sections/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Green Flagged to access your verdicts, saved contracts, and billing.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-4rem] -z-10 h-[22rem] md:h-[26rem] bg-[url('/landing.avif')] bg-cover bg-bottom bg-no-repeat opacity-75 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,0.9)_30%,rgba(0,0,0,0.45)_60%,transparent_85%)] [-webkit-mask-image:linear-gradient(to_bottom,rgba(0,0,0,1)_0%,rgba(0,0,0,0.9)_30%,rgba(0,0,0,0.45)_60%,transparent_85%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-4rem] -z-10 h-[22rem] md:h-[26rem] bg-[linear-gradient(to_bottom,rgba(18,18,18,0)_0%,rgba(18,18,18,0.35)_55%,var(--bg)_95%)]"
      />

      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr,1fr] lg:gap-16">
          <div className="flex flex-col gap-5">
            <span className="text-label inline-flex items-center gap-2 self-start border border-border-glass bg-[var(--bg)] px-4 py-2 text-text-secondary">
              <Sparkles className="size-3.5 text-green-300" />
              Sign in — magic link, no passwords
            </span>

            <MaskedWordReveal as="h1" className="text-display-sm">
              Welcome back to{" "}
              <span className="text-green-300">green-flagged</span> contracts.
            </MaskedWordReveal>

            <p className="max-w-xl text-body text-text-secondary md:text-lg md:leading-8">
              We&apos;ll send a one-time link to your inbox. No passwords, no
              tracking, no ceremony. New here?{" "}
              <Link
                href="/#hero-drop"
                className="text-green-300 hover:underline"
              >
                Drop a contract first
              </Link>{" "}
              — sign-up happens after your first verdict.
            </p>

            <ul className="mt-4 flex flex-col gap-3 text-sm leading-6 text-text-secondary">
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-green-300"
                />
                Magic link expires in 15 minutes
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-green-400"
                />
                Single-device session, you can revoke at any time
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-green-500"
                />
                We never store your contracts after the verdict
              </li>
            </ul>
          </div>

          <SignInForm />
        </div>
      </Container>
    </section>
  );
}
