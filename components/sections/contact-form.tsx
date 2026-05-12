"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";

type Phase = "idle" | "submitting" | "done";

export function ContactForm() {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", email: "", message: "" });

  const onChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        setError(body.error ?? `HTTP ${res.status}`);
        setPhase("idle");
        return;
      }
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setPhase("idle");
    }
  };

  if (phase === "done") {
    return (
      <div className="gf-frame">
        <span className="gf-frame-bl" />
        <span className="gf-frame-br" />
        <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
          // GOT IT
        </span>
        <h3 className="gf-h3" style={{ marginTop: 12 }}>
          Message sent.
        </h3>
        <p className="gf-body-sm" style={{ marginTop: 12 }}>
          Thanks — we&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="gf-frame"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <span className="gf-frame-bl" />
      <span className="gf-frame-br" />
      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="gf-label">// NAME</span>
        <Input
          required
          placeholder="Your name"
          value={form.name}
          onChange={onChange("name")}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="gf-label">// EMAIL</span>
        <Input
          required
          type="email"
          placeholder="you@work.com"
          value={form.email}
          onChange={onChange("email")}
        />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="gf-label">// MESSAGE</span>
        <Textarea
          required
          placeholder="What do you need? (min 10 characters)"
          value={form.message}
          onChange={onChange("message")}
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
        disabled={phase === "submitting"}
        style={{ alignSelf: "flex-start" }}
      >
        {phase === "submitting" ? (
          <>
            <Loader2 width={14} height={14} className="animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send message <span className="arrow">→</span>
          </>
        )}
      </button>
    </form>
  );
}
