"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Phase = "idle" | "submitting" | "sent";

export function ForgotPasswordForm() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("submitting");
    setError(null);
    const supabase = getSupabaseBrowser();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      setError(error.message);
      setPhase("idle");
      return;
    }
    setPhase("sent");
  };

  if (phase === "sent") {
    return (
      <div className="gf-frame" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span className="gf-frame-bl" />
        <span className="gf-frame-br" />
        <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
          // CHECK YOUR INBOX
        </span>
        <h3 className="gf-h3">Reset link sent.</h3>
        <p className="gf-body-sm">
          If an account exists for{" "}
          <span style={{ color: "var(--fg-1)" }}>{email}</span>, we just emailed
          a one-time link to reset your password. It expires in 15 minutes.
        </p>
        <Link href="/sign-in" className="gf-btn-link">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="gf-frame" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <span className="gf-frame-bl" />
      <span className="gf-frame-br" />
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="gf-label">// EMAIL</span>
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
          <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="gf-btn"
          disabled={phase === "submitting" || !email}
          style={{ alignSelf: "flex-start" }}
        >
          {phase === "submitting" ? (
            <>
              <Loader2 width={14} height={14} className="animate-spin" />
              Sending link…
            </>
          ) : (
            <>
              Send reset link <span className="arrow">→</span>
            </>
          )}
        </button>
      </form>
      <Link href="/sign-in" className="gf-mono-sm" style={{ color: "var(--fg-2)" }}>
        ← Back to sign in
      </Link>
    </div>
  );
}
