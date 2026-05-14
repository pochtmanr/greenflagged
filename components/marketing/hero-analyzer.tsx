"use client";

import * as React from "react";
import Link from "next/link";

type Severity = "green" | "yellow" | "orange" | "red";
type Phase = "idle" | "ready" | "submitting" | "done" | "error";

type PreviewResponse = {
  severity: Severity;
  headline: string;
  total_flags: number;
  flag_counts: Record<Severity, number>;
  first_flag: { excerpt: string; issue: string } | null;
  redlines_locked: number;
};

const SEVERITY_LABEL: Record<Severity, string> = {
  green: "GREEN FLAGGED",
  yellow: "MINOR ISSUES",
  orange: "RED FLAGS",
  red: "DO NOT SIGN",
};

const STATUS_COPY: Record<Phase, string> = {
  idle: "AWAITING PASTE",
  ready: "READY · PASTE LOOKS GOOD",
  submitting: "REVIEWING WITH AI…",
  done: "VERDICT READY",
  error: "REVIEW FAILED",
};

const MIN_CHARS = 200;
const MAX_CHARS = 30_000;

export function HeroAnalyzer() {
  const [text, setText] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PreviewResponse | null>(null);

  const charCount = text.length;
  const canSubmit =
    phase !== "submitting" && charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (phase === "done" || phase === "error") {
      setPhase(e.target.value.length >= MIN_CHARS ? "ready" : "idle");
      setResult(null);
      setError(null);
    } else if (e.target.value.length >= MIN_CHARS) {
      setPhase("ready");
    } else {
      setPhase("idle");
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch("/api/scan/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? `Preview failed (${res.status})`);
        setPhase("error");
        return;
      }
      const data = (await res.json()) as PreviewResponse;
      setResult(data);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setPhase("error");
    }
  };

  return (
    <div className="hero-analyzer">
      <span className="hero-analyzer__tl" aria-hidden />
      <span className="hero-analyzer__tr" aria-hidden />
      <span className="hero-analyzer__bl" aria-hidden />
      <span className="hero-analyzer__br" aria-hidden />

      <div className="hero-analyzer__head">
        <span className="gf-label">// instant verdict · paste any contract</span>
        <span
          className="gf-mono-sm"
          style={{ color: "var(--fg-3)" }}
        >
          no signup · powered by Claude
        </span>
      </div>

      <div className="hero-analyzer__field">
        <textarea
          value={text}
          onChange={onChange}
          spellCheck={false}
          aria-label="Paste contract text"
          placeholder="Paste your contract here. Even one clause works. We'll flag the risky parts and tell you what to push back on…"
          maxLength={MAX_CHARS + 1000}
          rows={8}
        />
      </div>

      <div className="hero-analyzer__specs">
        <div className="gf-specrow">
          <span className="key">CHARS</span>
          <span className="dots" />
          <span className="val">
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
        <div className="gf-specrow" style={{ borderBottom: "none" }}>
          <span className="key">STATUS</span>
          <span className="dots" />
          <span
            className="val"
            style={{
              color:
                phase === "done"
                  ? "var(--sev-green)"
                  : phase === "error"
                  ? "var(--sev-red)"
                  : "var(--fg-2)",
            }}
          >
            {STATUS_COPY[phase]}
          </span>
        </div>
      </div>

      {phase === "error" && error ? (
        <div
          className="gf-mono-sm"
          style={{ color: "var(--sev-red)", paddingTop: 4 }}
        >
          {error}
        </div>
      ) : null}

      <div className="hero-analyzer__cta">
        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          Free preview · 3/day · no account
        </span>
        <button
          type="button"
          className="gf-btn gf-btn-accent"
          disabled={!canSubmit}
          onClick={submit}
        >
          {phase === "submitting"
            ? "Reviewing…"
            : phase === "done"
            ? "Verdict ready"
            : "Run free verdict"}{" "}
          <span className="arrow">→</span>
        </button>
      </div>

      {phase === "done" && result ? <HeroVerdictTeaser data={result} /> : null}
    </div>
  );
}

function HeroVerdictTeaser({ data }: { data: PreviewResponse }) {
  const counts = data.flag_counts;
  return (
    <div className="hero-analyzer__verdict">
      <div className="hero-analyzer__verdict-head">
        <span className={`gf-tag sev-${data.severity}`}>
          {SEVERITY_LABEL[data.severity]}
        </span>
        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          {data.total_flags} flag{data.total_flags === 1 ? "" : "s"} found
        </span>
      </div>

      <p className="hero-analyzer__headline">{data.headline}</p>

      <div className="hero-analyzer__counts">
        {counts.red > 0 ? (
          <span className="gf-tag sev-red">{counts.red} RED</span>
        ) : null}
        {counts.orange > 0 ? (
          <span className="gf-tag sev-orange">{counts.orange} HIGH</span>
        ) : null}
        {counts.yellow > 0 ? (
          <span className="gf-tag sev-yellow">{counts.yellow} WARN</span>
        ) : null}
        {counts.green > 0 ? (
          <span className="gf-tag sev-green">{counts.green} OK</span>
        ) : null}
      </div>

      {data.first_flag ? (
        <div className="hero-analyzer__flag">
          <div className="gf-label" style={{ color: "var(--fg-3)" }}>
            // first flag · plain english
          </div>
          <blockquote className="hero-analyzer__excerpt">
            “{data.first_flag.excerpt}”
          </blockquote>
          <p className="hero-analyzer__issue">{data.first_flag.issue}</p>
        </div>
      ) : null}

      {data.redlines_locked > 0 ? (
        <div className="hero-analyzer__locked">
          <div className="hero-analyzer__locked-rows" aria-hidden>
            {Array.from({ length: Math.min(data.redlines_locked, 3) }).map(
              (_, i) => (
                <div key={i} className="hero-analyzer__locked-row">
                  <span className="hero-analyzer__locked-bar" />
                  <span className="hero-analyzer__locked-bar hero-analyzer__locked-bar--short" />
                </div>
              )
            )}
          </div>
          <div className="hero-analyzer__locked-overlay">
            <div className="gf-label">
              {data.redlines_locked} more flag
              {data.redlines_locked === 1 ? "" : "s"} · suggested redlines · pdf
              report
            </div>
            <Link
              href="/sign-up?redirect=/scan"
              className="gf-btn gf-btn-accent"
            >
              Sign up free to unlock <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      ) : (
        <Link
          href="/sign-up?redirect=/scan"
          className="gf-btn gf-btn-accent hero-analyzer__cta-full"
        >
          Sign up free for the full report <span className="arrow">→</span>
        </Link>
      )}
    </div>
  );
}
