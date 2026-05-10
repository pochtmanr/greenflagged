"use client";

import * as React from "react";
import { FileUp, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientShell } from "@/components/ui/gradient-shell";
import { VerdictBadge } from "@/components/brand/verdict-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitLead } from "@/lib/email-capture";
import { cn } from "@/lib/cn";

type Phase = "idle" | "ready" | "submitting" | "done";

const ACCEPT = ".pdf,.docx,.txt,application/pdf,application/msword";
const MAX_BYTES = 25 * 1024 * 1024;

export function HeroDropZone() {
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError("File is over 25 MB. Try a smaller one.");
      return;
    }
    setError(null);
    setFile(f);
    setPhase("ready");
    setDialogOpen(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f ?? null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase("submitting");
    setError(null);
    const res = await submitLead({
      email,
      source: "hero-drop",
      fileName: file?.name,
    });
    if (!res.ok) {
      setError(res.error);
      setPhase("ready");
      return;
    }
    setPhase("done");
    setDialogOpen(false);
  };

  return (
    <div id="hero-drop" className="relative">
      <GradientShell>
        <GlassCard
          padded="lg"
          strong
          className="relative gap-6"
          aria-label="Upload your contract"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="text-label text-text-secondary">
              Drop your contract
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-secondary">
              <ShieldCheck className="size-4 text-green-300" />
              Encrypted · auto-deleted
            </div>
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed p-8 text-center transition-colors",
              dragOver
                ? "border-green-500 bg-green-500/5"
                : "border-border-glass hover:border-green-300/40",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <FileUp className="size-10 text-green-300" strokeWidth={1.5} />
            <div>
              <p className="text-base font-medium text-text-primary">
                {file ? file.name : "Drag a contract here, or click to upload"}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                PDF, DOCX, or TXT · up to 25 MB
              </p>
            </div>
            {error ? (
              <p className="text-xs text-[var(--severity-red)]">{error}</p>
            ) : null}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-text-secondary">
              Free. No account needed. Verdict in under 2 minutes.
            </p>
            <Button
              type="button"
              variant="light"
              size="md"
              onClick={() => inputRef.current?.click()}
            >
              Choose file →
            </Button>
          </div>

          {phase === "done" ? (
            <SampleResult />
          ) : null}
        </GlassCard>
      </GradientShell>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Where should we send your verdict?</DialogTitle>
            <DialogDescription>
              We&apos;ll email a sample verdict for{" "}
              <span className="text-text-primary">{file?.name ?? "your contract"}</span>{" "}
              and keep you posted when the full product is live.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              required
              placeholder="you@work.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
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
                  Send my verdict
                  <span aria-hidden className="btn-arrow transition-transform">→</span>
                </>
              )}
            </Button>
            <p className="text-[11px] leading-4 text-text-secondary">
              By submitting you agree to our{" "}
              <a href="/terms" className="underline hover:text-green-300">
                terms
              </a>{" "}
              and{" "}
              <a href="/privacy" className="underline hover:text-green-300">
                privacy policy
              </a>
              . Informational, not legal advice.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SampleResult() {
  return (
    <div className="mt-4 border-t border-border-glass pt-6">
      <div className="mb-4 flex items-center justify-between text-label">
        <span className="text-text-secondary">Sample verdict</span>
        <span className="text-green-300">Check your inbox</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <VerdictBadge severity="red">2 red flags</VerdictBadge>
        <VerdictBadge severity="orange">3 warnings</VerdictBadge>
        <VerdictBadge severity="yellow">5 notes</VerdictBadge>
        <VerdictBadge severity="green">14 fine</VerdictBadge>
      </div>
      <p className="mt-4 text-xs leading-5 text-text-secondary">
        We&apos;ve emailed you a four-clause sample from your contract.
        The full analysis arrives when we go live — you&apos;re first in line.
      </p>
    </div>
  );
}
