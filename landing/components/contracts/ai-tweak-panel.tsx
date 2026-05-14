"use client";

import * as React from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { lineDiff } from "@/lib/markdown/line-diff";

type Props = {
  contractId: string;
  /** Apply the AI's revised body to the editor. */
  onApply: (nextBodyMd: string) => void;
};

type DraftResult = {
  previous: string;
  revised: string;
} | null;

export function AiTweakPanel({ contractId, onApply }: Props) {
  const [instruction, setInstruction] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftResult>(null);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    const text = instruction.trim();
    if (!text) {
      setError("Add an instruction first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/tweak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Tweak failed (${res.status})`);
      }
      const data = (await res.json()) as {
        body_md: string;
        previous_body_md: string;
      };
      setDraft({ previous: data.previous_body_md, revised: data.body_md });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      toast.error("Couldn't apply tweak");
    } finally {
      setLoading(false);
    }
  };

  const accept = () => {
    if (!draft) return;
    onApply(draft.revised);
    setDraft(null);
    setInstruction("");
    toast.success("Applied — remember to save");
  };

  const reject = () => {
    setDraft(null);
  };

  return (
    <>
      <div
        className="gf-card"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <span className="gf-label">// EDIT WITH AI</span>
        <p
          className="gf-body-sm"
          style={{ color: "var(--fg-3)", margin: 0, fontSize: 13 }}
        >
          Paste a clause, describe what's missing, or ask for a rewrite. AI
          will revise the contract and show you the diff before applying.
        </p>
        <textarea
          className="gf-textarea"
          rows={4}
          value={instruction}
          placeholder="e.g. Add a 6-month non-compete for direct competitors only."
          onChange={(e) => setInstruction(e.target.value)}
          disabled={loading}
        />
        {error ? (
          <p
            className="gf-mono-sm"
            style={{ color: "var(--sev-red)", margin: 0, fontSize: 12 }}
          >
            {error}
          </p>
        ) : null}
        <button
          type="button"
          className="gf-btn"
          onClick={submit}
          disabled={loading || !instruction.trim()}
        >
          <Sparkles
            size={14}
            style={{
              marginRight: 6,
              animation: loading ? "gf-spin 1s linear infinite" : undefined,
            }}
          />
          {loading ? "Reviewing…" : "Apply with AI"}
        </button>
      </div>

      {draft ? (
        <DiffModal
          previous={draft.previous}
          revised={draft.revised}
          onAccept={accept}
          onReject={reject}
        />
      ) : null}
    </>
  );
}

type DiffModalProps = {
  previous: string;
  revised: string;
  onAccept: () => void;
  onReject: () => void;
};

function DiffModal({ previous, revised, onAccept, onReject }: DiffModalProps) {
  const diff = React.useMemo(() => lineDiff(previous, revised), [
    previous,
    revised,
  ]);
  const adds = diff.filter((d) => d.kind === "add").length;
  const dels = diff.filter((d) => d.kind === "del").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        padding: 24,
      }}
      onClick={onReject}
    >
      <div
        className="gf-frame"
        style={{
          background: "var(--bg)",
          maxWidth: 920,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="gf-frame-bl" />
        <span className="gf-frame-br" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span className="gf-label">// AI REVIEW</span>
            <p className="gf-body-sm" style={{ color: "var(--fg-3)", margin: "4px 0 0" }}>
              {adds} addition{adds === 1 ? "" : "s"} · {dels} removal
              {dels === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onReject}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              background: "transparent",
              border: "1px solid var(--rule)",
              color: "var(--fg-3)",
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="tweak-diff__panel">
          {diff.map((line, i) => (
            <div
              key={i}
              className={
                line.kind === "add"
                  ? "tweak-diff__line tweak-diff__line--add"
                  : line.kind === "del"
                    ? "tweak-diff__line tweak-diff__line--del"
                    : "tweak-diff__line tweak-diff__line--ctx"
              }
            >
              <span style={{ userSelect: "none", marginRight: 6 }}>
                {line.kind === "add" ? "+" : line.kind === "del" ? "−" : " "}
              </span>
              {line.text || " "}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            flexWrap: "wrap",
            paddingTop: 8,
            borderTop: "1px solid var(--rule)",
          }}
        >
          <button
            type="button"
            className="gf-btn-ghost"
            onClick={onReject}
          >
            Discard
          </button>
          <button type="button" className="gf-btn" onClick={onAccept}>
            Apply changes <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
