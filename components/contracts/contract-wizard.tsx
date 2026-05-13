"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INDUSTRY_META, type IndustryMeta } from "@/lib/contracts/manifest";
import type { Question } from "@/lib/contracts/types";
import { COUNTRIES } from "@/lib/countries";
import { MarkdownPreview } from "@/lib/markdown/render-react";
import { QuestionField } from "./question-field";

type PickerOption = {
  id: string;
  eyebrow: string;
  label: string;
  description: string;
  meta?: IndustryMeta;
  custom?: true;
};

const PICKER_OPTIONS: PickerOption[] = [
  ...INDUSTRY_META.map((m) => ({
    id: m.id,
    eyebrow: m.eyebrow,
    label: m.label,
    description: m.description,
    meta: m,
  })),
  {
    id: "custom",
    eyebrow: "// 05 / CUSTOM",
    label: "Describe your own",
    description: "Tell us about the engagement and we'll draft a tailored contract.",
    custom: true,
  },
];

type Mode =
  | { kind: "picker" }
  | { kind: "wizard"; meta: IndustryMeta; step: number }
  | { kind: "custom" }
  | { kind: "streaming"; industry: string; description: string; jurisdiction: string }
  | { kind: "preview"; industry: string; bodyMd: string; title: string; answers?: Record<string, unknown> };

type Defaults = {
  provider_name?: string | null;
  provider_country?: string | null;
};

type Props = {
  defaults?: Defaults;
};

function defaultAnswers(meta: IndustryMeta, defaults: Defaults | undefined) {
  const out: Record<string, unknown> = {};
  for (const q of meta.questions) {
    if (q.kind === "number" && typeof q.defaultValue === "number") {
      out[q.id] = q.defaultValue;
    } else if (q.kind === "toggle") {
      out[q.id] = typeof q.defaultValue === "boolean" ? q.defaultValue : false;
    } else if (q.kind === "checkbox-group") {
      out[q.id] = q.defaultValue ?? [];
    }
  }
  if (defaults?.provider_name && Object.prototype.hasOwnProperty.call(out, "provider_name") === false) {
    if (meta.questions.some((q) => q.id === "provider_name")) {
      out.provider_name = defaults.provider_name;
    }
  }
  if (defaults?.provider_country && meta.questions.some((q) => q.id === "governing_law")) {
    out.governing_law = defaults.provider_country;
  }
  return out;
}

function isQuestionAnswered(q: Question, value: unknown): boolean {
  if (!("required" in q) || !q.required) return true;
  if (q.kind === "text" || q.kind === "select" || q.kind === "date") {
    return typeof value === "string" && value.trim().length > 0;
  }
  if (q.kind === "number") {
    return typeof value === "number" && !Number.isNaN(value);
  }
  return true;
}

export function ContractWizard({ defaults }: Props) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>({ kind: "picker" });
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // custom-mode form state
  const [customIndustry, setCustomIndustry] = React.useState("");
  const [customJurisdiction, setCustomJurisdiction] = React.useState(
    defaults?.provider_country ?? "",
  );
  const [customDescription, setCustomDescription] = React.useState("");

  const pickIndustry = (opt: PickerOption) => {
    setError(null);
    if (opt.custom) {
      setMode({ kind: "custom" });
      return;
    }
    if (!opt.meta) return;
    setAnswers(defaultAnswers(opt.meta, defaults));
    setMode({ kind: "wizard", meta: opt.meta, step: 0 });
  };

  const goBackToPicker = () => {
    setAnswers({});
    setError(null);
    setMode({ kind: "picker" });
  };

  // ────────── PICKER ──────────
  if (mode.kind === "picker") {
    return (
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="gf-label">// NEW CONTRACT</span>
              <h1 className="gf-h1">Pick a starting point.</h1>
              <p className="gf-body" style={{ color: "var(--fg-2)", maxWidth: 640 }}>
                Choose a template that matches the engagement. Each one walks you
                through a few questions, then drafts a clean, plain-language
                contract you can negotiate from.
              </p>
            </header>

            <div className="wizard__grid">
              {PICKER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="gf-frame wizard__card"
                  onClick={() => pickIndustry(opt)}
                >
                  <span className="gf-frame-bl" />
                  <span className="gf-frame-br" />
                  <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
                    {opt.eyebrow}
                  </span>
                  <h3 className="gf-h3" style={{ textAlign: "left" }}>{opt.label}</h3>
                  <p className="gf-body-sm" style={{ color: "var(--fg-2)", textAlign: "left", margin: 0 }}>
                    {opt.description}
                  </p>
                  <span
                    className="gf-mono-sm"
                    style={{ color: "var(--fg-1)", marginTop: "auto", textAlign: "left" }}
                  >
                    Start <span className="arrow">→</span>
                  </span>
                </button>
              ))}
            </div>

            <Link href="/dashboard" className="gf-btn-link" style={{ alignSelf: "flex-start" }}>
              ← Back to dashboard
            </Link>
          </div>
        </div>
        <WizardStyles />
      </section>
    );
  }

  // ────────── WIZARD (template) ──────────
  if (mode.kind === "wizard") {
    const { meta, step } = mode;
    const question = meta.questions[step];
    if (!question) return null;
    const value = answers[question.id];

    const onChange = (next: unknown) => {
      setAnswers((prev) => ({ ...prev, [question.id]: next }));
      setError(null);
    };

    const isLast = step === meta.questions.length - 1;
    const canAdvance = isQuestionAnswered(question, value);

    const onNext = async () => {
      if (!canAdvance) {
        setError("Please answer this question to continue.");
        return;
      }
      if (!isLast) {
        setMode({ kind: "wizard", meta, step: step + 1 });
        return;
      }
      await submitTemplate(meta, answers, {
        setSubmitting,
        setError,
        onPreview: (bodyMd, title) =>
          setMode({ kind: "preview", industry: meta.id, bodyMd, title, answers }),
      });
    };

    const onBack = () => {
      if (step === 0) {
        goBackToPicker();
        return;
      }
      setMode({ kind: "wizard", meta, step: step - 1 });
    };

    return (
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
            <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
                {meta.eyebrow}
              </span>
              <h1 className="gf-h2" style={{ marginTop: 0 }}>{meta.label}</h1>
              <ProgressDots total={meta.questions.length} index={step} />
            </header>

            <div
              className="gf-frame"
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <span className="gf-frame-bl" />
              <span className="gf-frame-br" />
              <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
                Question {step + 1} of {meta.questions.length}
              </span>
              <QuestionField
                question={question}
                value={value}
                onChange={onChange}
                error={error}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <button type="button" className="gf-btn-ghost" onClick={onBack} disabled={submitting}>
                ← Back
              </button>
              <button
                type="button"
                className="gf-btn"
                onClick={onNext}
                disabled={submitting}
              >
                {submitting ? "Drafting…" : isLast ? "Generate draft" : "Next"}{" "}
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
        <WizardStyles />
      </section>
    );
  }

  // ────────── CUSTOM (Describe your own) ──────────
  if (mode.kind === "custom") {
    const canSubmit =
      customIndustry.trim().length > 0 && customDescription.trim().length >= 20;

    const onSubmit = () => {
      if (!canSubmit) {
        setError(
          "Please add a short industry label and a description (20+ characters).",
        );
        return;
      }
      setError(null);
      setMode({
        kind: "streaming",
        industry: customIndustry.trim(),
        description: customDescription.trim(),
        jurisdiction: customJurisdiction.trim(),
      });
    };

    return (
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              maxWidth: 720,
            }}
          >
            <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
                // CUSTOM
              </span>
              <h1 className="gf-h2" style={{ marginTop: 0 }}>
                Describe your own contract
              </h1>
              <p className="gf-body" style={{ color: "var(--fg-2)", maxWidth: 600 }}>
                The AI will draft a tailored contract from your description.
                Add as much detail as you can — parties, scope, payment, anything
                that matters.
              </p>
            </header>

            <div
              className="gf-frame"
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <span className="gf-frame-bl" />
              <span className="gf-frame-br" />

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  className="gf-mono-sm"
                  style={{
                    color: "var(--fg-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontSize: 12,
                  }}
                  htmlFor="custom-industry"
                >
                  Industry / type{" "}
                  <span style={{ color: "var(--accent-strong)" }}>*</span>
                </label>
                <input
                  id="custom-industry"
                  className="gf-input"
                  type="text"
                  placeholder="e.g. Photography retainer"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  className="gf-mono-sm"
                  style={{
                    color: "var(--fg-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontSize: 12,
                  }}
                  htmlFor="custom-juris"
                >
                  Governing law (country)
                </label>
                <select
                  id="custom-juris"
                  className="gf-input"
                  value={customJurisdiction}
                  onChange={(e) => setCustomJurisdiction(e.target.value)}
                  style={{ appearance: "auto" }}
                >
                  <option value="">Select… (optional)</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label
                  className="gf-mono-sm"
                  style={{
                    color: "var(--fg-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontSize: 12,
                  }}
                  htmlFor="custom-desc"
                >
                  Describe the engagement{" "}
                  <span style={{ color: "var(--accent-strong)" }}>*</span>
                </label>
                <textarea
                  id="custom-desc"
                  className="gf-textarea"
                  rows={10}
                  placeholder="Who are the parties, what's the scope, what are the payment terms, what's the timeline, anything else?"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                />
              </div>

              {error ? (
                <p
                  className="gf-mono-sm"
                  style={{ color: "var(--sev-red)", margin: 0 }}
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <button type="button" className="gf-btn-ghost" onClick={goBackToPicker}>
                ← Back
              </button>
              <button
                type="button"
                className="gf-btn"
                onClick={onSubmit}
                disabled={!canSubmit}
              >
                Generate with AI <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
        <WizardStyles />
      </section>
    );
  }

  // ────────── STREAMING (AI fallback) ──────────
  if (mode.kind === "streaming") {
    return (
      <StreamingPanel
        industry={mode.industry}
        description={mode.description}
        jurisdiction={mode.jurisdiction}
        onAbort={() => setMode({ kind: "custom" })}
        onComplete={(bodyMd, title) =>
          setMode({ kind: "preview", industry: mode.industry, bodyMd, title })
        }
      />
    );
  }

  // ────────── PREVIEW ──────────
  if (mode.kind === "preview") {
    const onSave = async () => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/contracts/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry: mode.industry,
            body_md: mode.bodyMd,
            title: mode.title,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Save failed (${res.status})`);
        }
        const data = (await res.json()) as { contract_id: string };
        router.push(`/contracts/${data.contract_id}/edit`);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setSubmitting(false);
      }
    };

    return (
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container">
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
                // PREVIEW
              </span>
              <h1 className="gf-h2" style={{ marginTop: 0 }}>
                {mode.title}
              </h1>
              <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
                Review the draft. You can negotiate any clause — this is a
                starting point, not the final word.
              </p>
            </header>

            <div className="gf-card" style={{ maxWidth: 880 }}>
              <MarkdownPreview source={mode.bodyMd} />
            </div>

            {error ? (
              <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
                {error}
              </p>
            ) : null}

            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="gf-btn"
                onClick={onSave}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save & finish"}{" "}
                <span className="arrow">→</span>
              </button>
              <button
                type="button"
                className="gf-btn-ghost"
                onClick={() => {
                  if (mode.answers) {
                    const meta = INDUSTRY_META.find((m) => m.id === mode.industry);
                    if (meta) {
                      setAnswers(mode.answers);
                      setMode({ kind: "wizard", meta, step: 0 });
                      return;
                    }
                  }
                  setMode({ kind: "custom" });
                }}
                disabled={submitting}
              >
                ← Edit answers
              </button>
            </div>
          </div>
        </div>
        <WizardStyles />
      </section>
    );
  }

  return null;
}

function ProgressDots({ total, index }: { total: number; index: number }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: i === index ? 24 : 8,
            height: 4,
            background:
              i <= index ? "var(--accent-strong)" : "var(--rule)",
            borderRadius: 2,
            transition: "width 200ms ease, background 200ms ease",
          }}
        />
      ))}
    </div>
  );
}

async function submitTemplate(
  meta: IndustryMeta,
  answers: Record<string, unknown>,
  ctx: {
    setSubmitting: (v: boolean) => void;
    setError: (v: string | null) => void;
    onPreview: (bodyMd: string, title: string) => void;
  },
) {
  ctx.setError(null);
  ctx.setSubmitting(true);
  try {
    const res = await fetch("/api/contracts/draft/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry: meta.id, answers }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Render failed (${res.status})`);
    }
    const data = (await res.json()) as { body_md: string; title: string };
    ctx.onPreview(data.body_md, data.title);
  } catch (err) {
    ctx.setError(err instanceof Error ? err.message : String(err));
  } finally {
    ctx.setSubmitting(false);
  }
}

type StreamingPanelProps = {
  industry: string;
  description: string;
  jurisdiction: string;
  onAbort: () => void;
  onComplete: (bodyMd: string, title: string) => void;
};

function StreamingPanel({
  industry,
  description,
  jurisdiction,
  onAbort,
  onComplete,
}: StreamingPanelProps) {
  const [accumulated, setAccumulated] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch("/api/contracts/draft/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industry,
            description,
            jurisdiction: jurisdiction || undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Stream failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";

        while (true) {
          const { value, done: streamDone } = await reader.read();
          if (streamDone) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;
            try {
              const parsed = JSON.parse(payload) as
                | { type: "delta"; text: string }
                | { type: "done" }
                | { type: "error"; message: string };
              if (parsed.type === "delta") {
                full += parsed.text;
                setAccumulated(full);
              } else if (parsed.type === "done") {
                setDone(true);
              } else if (parsed.type === "error") {
                throw new Error(parsed.message);
              }
            } catch (parseErr) {
              throw parseErr instanceof Error ? parseErr : new Error(String(parseErr));
            }
          }
        }

        // ensure done is set even if no done event
        setDone(true);

        const title = extractTitle(full) || `Custom contract — ${industry}`;
        onComplete(full, title);
      } catch (err) {
        if (controller.signal.aborted) return;
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
              // AI DRAFT
            </span>
            <h1 className="gf-h2" style={{ marginTop: 0 }}>
              {done ? "Draft ready" : "Drafting…"}
            </h1>
            <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
              {done
                ? "Review below, then save to keep this contract."
                : "Streaming from the model. This usually takes 20–40 seconds."}
            </p>
          </header>

          {errorMsg ? (
            <div className="gf-card" style={{ borderColor: "var(--sev-red)" }}>
              <p className="gf-body" style={{ color: "var(--sev-red)" }}>
                {errorMsg}
              </p>
              <button type="button" className="gf-btn-ghost" onClick={onAbort}>
                ← Try again
              </button>
            </div>
          ) : (
            <div className="gf-card" style={{ maxWidth: 880 }}>
              {accumulated ? (
                <MarkdownPreview source={accumulated} />
              ) : (
                <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
                  Waiting for the first token…
                </p>
              )}
            </div>
          )}

          {!done && !errorMsg ? (
            <button type="button" className="gf-btn-ghost" onClick={() => {
              abortRef.current?.abort();
              onAbort();
            }}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
      <WizardStyles />
    </section>
  );
}

function extractTitle(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function WizardStyles() {
  return (
    <style>{`
      .wizard__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 24px;
      }
      @media (max-width: 720px) {
        .wizard__grid { grid-template-columns: 1fr; }
      }
      .wizard__card {
        display: flex;
        flex-direction: column;
        gap: 16px;
        text-align: left;
        cursor: pointer;
        background: var(--surface);
        color: inherit;
        font: inherit;
      }
      .wizard__card:hover { background: var(--surface-2, var(--surface)); }
    `}</style>
  );
}
