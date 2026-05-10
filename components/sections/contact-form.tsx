"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
      <div className="glass-strong p-8">
        <h3 className="text-2xl font-bold uppercase tracking-[-0.02em] text-green-300">
          Got it.
        </h3>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Thanks — we&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        required
        placeholder="Your name"
        value={form.name}
        onChange={onChange("name")}
      />
      <Input
        required
        type="email"
        placeholder="you@work.com"
        value={form.email}
        onChange={onChange("email")}
      />
      <Textarea
        required
        placeholder="What do you need? (min 10 characters)"
        value={form.message}
        onChange={onChange("message")}
      />
      {error ? (
        <p className="text-xs text-[var(--severity-red)]">{error}</p>
      ) : null}
      <Button
        type="submit"
        variant="light"
        size="lg"
        disabled={phase === "submitting"}
        className="self-start"
      >
        {phase === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send message
            <span aria-hidden className="btn-arrow transition-transform">→</span>
          </>
        )}
      </Button>
    </form>
  );
}
