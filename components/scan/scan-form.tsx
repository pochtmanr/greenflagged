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
  | { kind: "error"; message: string };

const ACCEPTED = ".pdf,.docx,.txt";

function formatSize(bytes: number) {
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
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

  return (
    <div className="dropzone-wrap">
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

      {mode === "upload" ? (
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
          style={busy ? { cursor: "wait", opacity: 0.7 } : undefined}
        >
          <span className="dropzone__bl" />
          <span className="dropzone__br" />
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={(e) => pickFile(e.target.files?.[0])}
            style={{ display: "none" }}
            disabled={busy}
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
          disabled={busy}
          style={{ minHeight: 320 }}
        />
      )}

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

      <div className="dropzone__cta">
        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          Verdict in under 30 seconds. Private to your account.
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
