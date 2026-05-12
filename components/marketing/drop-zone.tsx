"use client";

import * as React from "react";

type Phase = "idle" | "ready" | "done";
type FileInfo = { name: string; size: string };

export function DropZone() {
  const [file, setFile] = React.useState<FileInfo | null>(null);
  const [drag, setDrag] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handle = (f: File | undefined | null) => {
    if (!f) return;
    setFile({ name: f.name, size: (f.size / 1048576).toFixed(2) + " MB" });
    setPhase("ready");
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) =>
    handle(e.target.files?.[0]);

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDrag(false);
    handle(e.dataTransfer.files?.[0]);
  };

  const submit = () => setPhase("done");

  return (
    <div id="hero-drop" className="dropzone-wrap">
      <div className="dropzone__head">
        <span className="gf-label">// drop zone · pdf · docx · txt</span>
        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          ≤ 25 MB · encrypted · auto-delete
        </span>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={"dropzone " + (drag ? "dropzone--drag" : "")}
      >
        <span className="dropzone__bl" />
        <span className="dropzone__br" />
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={onPick}
          style={{ display: "none" }}
        />
        <div className="dropzone__glyph">↑</div>
        <div className="dropzone__title">
          {file ? file.name : "Drag a contract here, or click to upload"}
        </div>
        <div className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          {file ? (
            <>
              {file.size} · ready to scan
            </>
          ) : (
            <>PDF, DOCX, or TXT · up to 25 MB</>
          )}
        </div>
      </label>

      <div className="dropzone__specs">
        <div className="gf-specrow">
          <span className="key">FILE</span>
          <span className="dots" />
          <span className="val">{file ? file.name : "—"}</span>
        </div>
        <div className="gf-specrow">
          <span className="key">SIZE</span>
          <span className="dots" />
          <span className="val">{file ? file.size : "—"}</span>
        </div>
        <div className="gf-specrow" style={{ borderBottom: "none" }}>
          <span className="key">STATUS</span>
          <span className="dots" />
          <span
            className="val"
            style={{
              color: phase === "done" ? "var(--sev-green)" : "var(--fg-2)",
            }}
          >
            {phase === "idle" && "WAITING FOR FILE"}
            {phase === "ready" && "READY · 0/12 PAGES SCANNED"}
            {phase === "done" && "GREEN-FLAGGED · 2 RED, 3 WARN, 5 NOTES"}
          </span>
        </div>
      </div>

      <div className="dropzone__cta">
        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          Free. No account. Verdict in under 2 minutes.
        </span>
        <button
          type="button"
          className="gf-btn"
          disabled={phase !== "ready"}
          onClick={submit}
        >
          {phase === "done" ? "Scan complete" : "Run verdict"}{" "}
          <span className="arrow">→</span>
        </button>
      </div>

      {phase === "done" ? (
        <div className="dropzone__result">
          <span className="gf-tag sev-red">2 RED FLAGS</span>
          <span className="gf-tag sev-orange">3 WARNINGS</span>
          <span className="gf-tag sev-yellow">5 NOTES</span>
          <span className="gf-tag sev-green">14 FINE</span>
        </div>
      ) : null}
    </div>
  );
}
