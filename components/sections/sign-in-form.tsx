"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/google-button";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";
type Phase = "idle" | "submitting" | "sent";

type Props = {
  defaultMode?: Mode;
};

export function SignInForm({ defaultMode = "sign-in" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams?.get("redirect") ?? "/dashboard";

  const [mode, setMode] = React.useState<Mode>(defaultMode);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const isSignUp = mode === "sign-up";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("submitting");
    setError(null);

    const supabase = getSupabaseBrowser();

    try {
      if (isSignUp) {
        const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirectParam
        )}`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback },
        });
        if (error) {
          setError(error.message);
          setPhase("idle");
          return;
        }
        // If email confirmation is on, no session yet — show inbox screen.
        // If it's off, Supabase returns a session immediately and we can route.
        if (data.session) {
          router.push(redirectParam);
          router.refresh();
          return;
        }
        setPhase("sent");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
          setPhase("idle");
          return;
        }
        router.push(redirectParam);
        router.refresh();
      }
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
        <h3 className="gf-h3">Confirm your email.</h3>
        <p className="gf-body-sm">
          We sent a confirmation link to{" "}
          <span style={{ color: "var(--fg-1)" }}>{email}</span>. Open it to
          activate your account.
        </p>
        <button
          type="button"
          className="gf-btn-link"
          onClick={() => {
            setPhase("idle");
            setMode("sign-in");
          }}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="gf-frame" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <span className="gf-frame-bl" />
      <span className="gf-frame-br" />

      <GoogleButton redirectTo={redirectParam} />

      <div
        style={{ display: "flex", alignItems: "center", gap: 12 }}
        className="gf-label"
      >
        <span aria-hidden style={{ height: 1, flex: 1, background: "var(--rule)" }} />
        or
        <span aria-hidden style={{ height: 1, flex: 1, background: "var(--rule)" }} />
      </div>

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

        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="gf-label">// PASSWORD</span>
          <Input
            required
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="••••••••"
            minLength={isSignUp ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error ? (
          <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
            {error}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <button
            type="submit"
            className="gf-btn"
            disabled={phase === "submitting" || !email || !password}
          >
            {phase === "submitting" ? (
              <>
                <Loader2 width={14} height={14} className="animate-spin" />
                {isSignUp ? "Creating account…" : "Signing in…"}
              </>
            ) : (
              <>
                {isSignUp ? "Create account" : "Sign in"}{" "}
                <span className="arrow">→</span>
              </>
            )}
          </button>

          {!isSignUp ? (
            <Link
              href="/forgot-password"
              className="gf-mono-sm"
              style={{ color: "var(--fg-2)" }}
            >
              Forgot password?
            </Link>
          ) : null}
        </div>
      </form>

      <p className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("sign-in");
                setError(null);
              }}
              style={{
                color: "var(--fg-1)",
                borderBottom: "1px solid currentColor",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("sign-up");
                setError(null);
              }}
              style={{
                color: "var(--fg-1)",
                borderBottom: "1px solid currentColor",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Sign up
            </button>
          </>
        )}
      </p>

      <p className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
        By continuing you agree to our{" "}
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
