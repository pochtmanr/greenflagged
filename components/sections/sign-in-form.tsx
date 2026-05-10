"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

type Phase = "idle" | "submitting" | "sent";

export function SignInForm() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(body.error ?? `HTTP ${res.status}`);
        setPhase("idle");
        return;
      }
      setPhase("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setPhase("idle");
    }
  };

  if (phase === "sent") {
    return (
      <GlassCard padded="lg" strong className="gap-4">
        <div className="text-label text-green-300">Check your inbox</div>
        <h3 className="text-2xl font-bold uppercase tracking-[-0.02em]">
          Link sent.
        </h3>
        <p className="text-sm leading-6 text-text-secondary">
          We just emailed a one-time sign-in link to{" "}
          <span className="text-text-primary">{email}</span>. It expires in 15
          minutes. Don&apos;t see it? Check spam or{" "}
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="text-green-300 hover:underline"
          >
            resend
          </button>
          .
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard padded="lg" strong className="gap-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-label text-text-secondary">Email</span>
          <Input
            required
            type="email"
            autoComplete="email"
            placeholder="you@work.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {error ? (
          <p className="text-xs text-[var(--severity-red)]">{error}</p>
        ) : null}

        <Button
          type="submit"
          variant="light"
          size="lg"
          disabled={phase === "submitting" || !email}
          className="self-start"
        >
          {phase === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending link…
            </>
          ) : (
            <>
              Send magic link
              <span aria-hidden className="btn-arrow transition-transform">
                →
              </span>
            </>
          )}
        </Button>
      </form>

      <div className="flex items-center gap-4 text-label text-text-secondary">
        <span className="h-px flex-1 bg-border-glass" />
        or
        <span className="h-px flex-1 bg-border-glass" />
      </div>

      <button
        type="button"
        disabled
        className="inline-flex h-12 items-center justify-center gap-3 rounded-[2px] border border-border-glass bg-[var(--surface)] px-4 text-sm text-text-secondary backdrop-blur-md transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleGlyph />
        Continue with Google
        <span className="ml-2 inline-flex items-center rounded-full border border-green-400/40 bg-green-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3px] text-green-300">
          Soon
        </span>
      </button>

      <p className="text-[11px] leading-5 text-text-secondary">
        By signing in you agree to our{" "}
        <a href="/terms" className="text-text-primary hover:underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-text-primary hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </GlassCard>
  );
}

function GoogleGlyph() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.75 3.28-8.07z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.96l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}
