"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

type Mode = "upload" | "paste";
type Phase =
  | { kind: "idle" }
  | { kind: "ready"; file: File }
  | { kind: "paste-ready" }
  | { kind: "parsing" }
  | { kind: "reviewing" }
  | { kind: "error"; message: string }
  | { kind: "paywall"; paywall_url: string };

const ACCEPTED = ".pdf,.docx,.txt";

const REVIEW_TICKER = [
  "Reading the document end to end…",
  "Checking IP ownership clauses…",
  "Inspecting payment terms and kill fees…",
  "Looking at termination and notice periods…",
  "Spotting runaway liability and indemnity traps…",
  "Reviewing confidentiality scope…",
  "Hunting auto-renewal language…",
  "Drafting plain-English redlines…",
];

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function formatElapsed(ms: number) {
  const total = Math.max(0, ms);
  const mm = Math.floor(total / 60000);
  const ss = Math.floor((total / 1000) % 60);
  return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}

function ScanProgress({
  phase,
  fileName,
}: {
  phase: "parsing" | "reviewing";
  fileName: string;
}) {
  const startRef = React.useRef<number>(0);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    startRef.current = performance.now();
    const id = setInterval(() => {
      setElapsed(performance.now() - startRef.current);
    }, 200);
    return () => clearInterval(id);
  }, []);

  const tickerIdx = Math.floor(elapsed / 2200) % REVIEW_TICKER.length;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        border: "1px dashed var(--paper-400)",
        borderRadius: 2,
        padding: "32px 24px",
        background:
          "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(127,212,76,0.04) 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <style>{`
        @keyframes gf-scan-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes gf-scan-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.78); }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            aria-hidden
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--green-500)",
              animation: "gf-scan-pulse 1.1s ease-in-out infinite",
              boxShadow: "0 0 0 4px rgba(127,212,76,0.18)",
            }}
          />
          <span className="gf-label">// scanning · {fileName}</span>
        </div>
        <span
          className="gf-mono-sm"
          style={{
            color: "var(--fg-3)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatElapsed(elapsed)} elapsed
        </span>
      </div>

      <div
        style={{
          position: "relative",
          height: 4,
          borderRadius: 999,
          background: "var(--paper-300, rgba(127,212,76,0.08))",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            width: "40%",
            background:
              "linear-gradient(90deg, rgba(127,212,76,0) 0%, var(--green-500) 50%, rgba(127,212,76,0) 100%)",
            animation: "gf-scan-bar 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <div
        className="gf-mono-sm"
        style={{
          color: "var(--fg-3)",
          minHeight: "1.4em",
          transition: "opacity 0.3s",
        }}
      >
        {phase === "parsing" ? "Reading file…" : REVIEW_TICKER[tickerIdx]}
      </div>

      <div
        className="gf-mono-sm"
        style={{
          color: "var(--fg-4)",
          borderTop: "1px dotted var(--paper-400)",
          paddingTop: 12,
        }}
      >
        Powered by ChatGPT 5.4 mini · Verdict will open automatically when
        ready.
      </div>
    </div>
  );
}

export function ScanForm() {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("upload");
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });
  const [drag, setDrag] = React.useState(false);
  const [pasted, setPasted] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const busy = phase.kind === "parsing" || phase.kind === "reviewing";
  const canSubmit =
    !busy &&
    ((mode === "upload" && phase.kind === "ready") ||
      (mode === "paste" && pasted.trim().length >= 40));

  function pickFile(f: File | undefined | null) {
    if (!f) return;
    setPhase({ kind: "ready", file: f });
  }

  function reset() {
    setPhase({ kind: "idle" });
    setPasted("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit() {
    if (!canSubmit) return;
    setPhase({ kind: "parsing" });

    try {
      let res: Response;
      if (mode === "upload" && phase.kind === "ready") {
        const form = new FormData();
        form.append("file", phase.file);
        setPhase({ kind: "parsing" });
        res = await fetch("/api/scan", { method: "POST", body: form });
      } else {
        setPhase({ kind: "reviewing" });
        res = await fetch("/api/scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: pasted }),
        });
      }

      if (mode === "upload") setPhase({ kind: "reviewing" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (
          res.status === 402 ||
          (body && typeof body.error === "string" && body.error === "quota_exceeded")
        ) {
          const url =
            (body && typeof body.paywall_url === "string" && body.paywall_url) ||
            "/settings/billing";
          setPhase({ kind: "paywall", paywall_url: url });
          return;
        }
        const message =
          (body && typeof body.error === "string" && body.error) ||
          `Request failed (${res.status})`;
        setPhase({ kind: "error", message });
        return;
      }

      const data = (await res.json()) as { contract_id?: string };
      if (!data.contract_id) {
        setPhase({ kind: "error", message: "No contract id returned" });
        return;
      }
      router.push(`/contracts/${data.contract_id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error while scanning";
      setPhase({ kind: "error", message });
    }
  }

  const status = (() => {
    if (phase.kind === "ready")
      return `READY · ${formatSize(phase.file.size)}`;
    if (phase.kind === "parsing") return "PARSING DOCUMENT…";
    if (phase.kind === "reviewing") return "REVIEWING WITH AI…";
    if (phase.kind === "error") return "ERROR";
    if (mode === "paste") return pasted ? "READY · PASTED TEXT" : "WAITING FOR TEXT";
    return "WAITING FOR FILE";
  })();

  const statusColor =
    phase.kind === "error"
      ? "var(--sev-red)"
      : phase.kind === "parsing" || phase.kind === "reviewing"
      ? "var(--green-500)"
      : phase.kind === "ready" || (mode === "paste" && pasted)
      ? "var(--green-500)"
      : "var(--fg-3)";

  const fileName =
    phase.kind === "ready" ? phase.file.name : mode === "paste" ? "Pasted text" : "—";
  const fileSize =
    phase.kind === "ready"
      ? formatSize(phase.file.size)
      : mode === "paste"
      ? `${pasted.length.toLocaleString()} chars`
      : "—";

  // Close paywall on Escape.
  React.useEffect(() => {
    if (phase.kind !== "paywall") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") reset();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase.kind]);

  return (
    <div className="dropzone-wrap">
      {phase.kind === "paywall" ? (
        <div
          className="paywall-overlay"
          role="presentation"
          onClick={reset}
        >
          <div
            className="paywall-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
              // QUOTA
            </span>
            <h3 id="paywall-title" className="gf-h3" style={{ margin: 0 }}>
              Out of contracts.
            </h3>
            <p
              className="gf-body-sm"
              style={{ margin: 0, color: "var(--fg-2)" }}
            >
              You&apos;ve used your monthly allowance. Upgrade to Standard
              for 10 contracts / month, or buy a single contract for $3.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              <button
                type="button"
                className="gf-btn gf-btn-ghost"
                onClick={reset}
              >
                Maybe later
              </button>
              <button
                type="button"
                className="gf-btn gf-btn-accent"
                onClick={() => router.push(phase.paywall_url)}
                autoFocus
              >
                Upgrade plan <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="dropzone__head">
        <span className="gf-label">// scanner · pdf · docx · txt · paste</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={
              "gf-btn-link " + (mode === "upload" ? "" : "is-muted")
            }
            onClick={() => {
              setMode("upload");
              reset();
            }}
            disabled={busy}
            aria-pressed={mode === "upload"}
            style={{
              opacity: mode === "upload" ? 1 : 0.55,
            }}
          >
            Upload
          </button>
          <span className="gf-mono-sm" style={{ color: "var(--fg-4)" }}>
            ·
          </span>
          <button
            type="button"
            className="gf-btn-link"
            onClick={() => {
              setMode("paste");
              reset();
            }}
            disabled={busy}
            aria-pressed={mode === "paste"}
            style={{
              opacity: mode === "paste" ? 1 : 0.55,
            }}
          >
            Paste text
          </button>
        </div>
      </div>

      {busy ? (
        <ScanProgress
          phase={phase.kind as "parsing" | "reviewing"}
          fileName={fileName}
        />
      ) : mode === "upload" ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (busy) return;
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={"dropzone " + (drag ? "dropzone--drag" : "")}
        >
          <span className="dropzone__bl" />
          <span className="dropzone__br" />
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={(e) => pickFile(e.target.files?.[0])}
            style={{ display: "none" }}
          />
          <div className="dropzone__glyph">↑</div>
          <div className="dropzone__title">
            {phase.kind === "ready"
              ? phase.file.name
              : "Drop a contract (PDF, DOCX, or .txt) — or click to browse"}
          </div>
          <div className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
            {phase.kind === "ready"
              ? `${formatSize(phase.file.size)} · ready to scan`
              : "Up to 10 MB · encrypted at rest · stays in your account"}
          </div>
        </label>
      ) : (
        <textarea
          className="gf-textarea"
          placeholder="Paste the contract text here — at least a paragraph."
          rows={18}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          style={{ minHeight: 320 }}
        />
      )}

      {busy ? null : (
        <div className="dropzone__specs">
          <div className="gf-specrow">
            <span className="key">SOURCE</span>
            <span className="dots" />
            <span className="val">{fileName}</span>
          </div>
          <div className="gf-specrow">
            <span className="key">SIZE</span>
            <span className="dots" />
            <span className="val">{fileSize}</span>
          </div>
          <div className="gf-specrow" style={{ borderBottom: "none" }}>
            <span className="key">STATUS</span>
            <span className="dots" />
            <span className="val" style={{ color: statusColor }}>
              {status}
            </span>
          </div>
        </div>
      )}

      {phase.kind === "error" ? (
        <div
          className="gf-mono-sm"
          style={{
            color: "var(--sev-red)",
            padding: "8px 0",
            borderTop: "1px dotted var(--paper-400)",
          }}
        >
          {phase.message}
        </div>
      ) : null}

      <div
        className="dropzone__cta"
        style={{ flexWrap: "wrap", gap: 12, rowGap: 12 }}
      >
        <span
          className="gf-mono-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--fg-3)",
            whiteSpace: "nowrap",
          }}
        >
          <span aria-hidden style={{ color: "var(--green-500)" }}>◆</span>
          Powered by ChatGPT 5.4 mini
        </span>
        <button
          type="button"
          className="gf-btn"
          disabled={!canSubmit}
          onClick={submit}
        >
          {phase.kind === "parsing"
            ? "Parsing…"
            : phase.kind === "reviewing"
            ? "Reviewing with AI…"
            : "Scan contract"}{" "}
          <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}
