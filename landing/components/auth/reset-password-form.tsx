"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Phase = "idle" | "submitting" | "done";

export function ResetPasswordForm() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setPhase("submitting");
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setPhase("idle");
      return;
    }
    setPhase("done");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="gf-frame" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <span className="gf-frame-bl" />
      <span className="gf-frame-br" />
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="gf-label">// NEW PASSWORD</span>
          <Input
            required
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="gf-label">// CONFIRM</span>
          <Input
            required
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          disabled={phase === "submitting" || phase === "done"}
          style={{ alignSelf: "flex-start" }}
        >
          {phase === "submitting" ? (
            <>
              <Loader2 width={14} height={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save password <span className="arrow">→</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
