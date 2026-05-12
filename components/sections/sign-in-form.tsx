"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

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
      <div className="gf-frame" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span className="gf-frame-bl" />
        <span className="gf-frame-br" />
        <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
          // CHECK YOUR INBOX
        </span>
        <h3 className="gf-h3">Link sent.</h3>
        <p className="gf-body-sm">
          We just emailed a one-time sign-in link to{" "}
          <span style={{ color: "var(--fg-1)" }}>{email}</span>. It expires in
          15 minutes. Don&apos;t see it? Check spam or{" "}
          <button
            type="button"
            onClick={() => setPhase("idle")}
            style={{
              color: "var(--green-700)",
              borderBottom: "1px solid currentColor",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
            }}
          >
            resend
          </button>
          .
        </p>
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
          <p
            className="gf-mono-sm"
            style={{ color: "var(--sev-red)" }}
          >
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
              Send magic link <span className="arrow">→</span>
            </>
          )}
        </button>
      </form>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
        className="gf-label"
      >
        <span
          aria-hidden
          style={{ height: 1, flex: 1, background: "var(--rule)" }}
        />
        or
        <span
          aria-hidden
          style={{ height: 1, flex: 1, background: "var(--rule)" }}
        />
      </div>

      <button
        type="button"
        disabled
        className="gf-btn gf-btn-ghost"
        style={{ justifyContent: "center" }}
      >
        <GoogleGlyph />
        Continue with Google
        <span
          style={{
            marginLeft: 8,
            padding: "2px 6px",
            fontSize: 9,
            border: "1px solid currentColor",
            letterSpacing: "0.14em",
          }}
        >
          SOON
        </span>
      </button>

      <p className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
        By signing in you agree to our{" "}
        <a href="/terms" style={{ color: "var(--fg-1)" }}>
          Terms
        </a>{" "}
        and{" "}
        <a href="/privacy" style={{ color: "var(--fg-1)" }}>
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
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
