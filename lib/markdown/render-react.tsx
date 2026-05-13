import * as React from "react";

type Block =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "subtitle"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ol"; items: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "hr" }
  | { kind: "footer"; text: string };

function tokenizeInline(text: string): React.ReactNode[] {
  const segs: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    if (start > lastIndex) segs.push(text.slice(lastIndex, start));
    const tok = match[0];
    if (tok.startsWith("**")) {
      segs.push(<strong key={`b-${key++}`}>{tok.slice(2, -2)}</strong>);
    } else {
      segs.push(<em key={`i-${key++}`}>{tok.slice(1, -1)}</em>);
    }
    lastIndex = start + tok.length;
  }
  if (lastIndex < text.length) segs.push(text.slice(lastIndex));
  return segs;
}

function parse(md: string): Block[] {
  const out: Block[] = [];
  for (const raw of md.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const para = raw.trim();
    if (!para) continue;

    if (para.startsWith("# ")) {
      out.push({ kind: "h1", text: para.replace(/^#\s+/, "") });
      continue;
    }
    if (para.startsWith("## ")) {
      out.push({ kind: "h2", text: para.replace(/^##\s+/, "") });
      continue;
    }
    if (para === "---") {
      out.push({ kind: "hr" });
      continue;
    }
    if (/^\*[^*]+\*$/.test(para)) {
      const inner = para.slice(1, -1);
      if (inner.toLowerCase().includes("drafted with ai")) {
        out.push({ kind: "footer", text: inner });
      } else {
        out.push({ kind: "subtitle", text: inner });
      }
      continue;
    }

    const lines = para.split("\n").map((line) => line.trim()).filter(Boolean);
    const allNumbered = lines.length > 0 && lines.every((line) => /^\d+\.\s+/.test(line));
    const allBulleted = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));

    if (allNumbered) {
      out.push({ kind: "ol", items: lines.map((l) => l.replace(/^\d+\.\s+/, "")) });
      continue;
    }
    if (allBulleted) {
      out.push({ kind: "ul", items: lines.map((l) => l.replace(/^[-*]\s+/, "")) });
      continue;
    }

    out.push({ kind: "p", text: lines.join(" ") });
  }
  return out;
}

export function MarkdownPreview({ source }: { source: string }) {
  const blocks = parse(source);
  return (
    <div className="legal-body">
      {blocks.map((b, i) => {
        if (b.kind === "h1") {
          return (
            <h1
              key={i}
              className="gf-h2"
              style={{ fontSize: 28, marginTop: 0 }}
            >
              {b.text}
            </h1>
          );
        }
        if (b.kind === "subtitle") {
          return (
            <p key={i} style={{ color: "var(--fg-3)", fontStyle: "italic", margin: 0 }}>
              {b.text}
            </p>
          );
        }
        if (b.kind === "h2") return <h2 key={i}>{b.text}</h2>;
        if (b.kind === "p") return <p key={i}>{tokenizeInline(b.text)}</p>;
        if (b.kind === "ol") {
          return (
            <ol key={i}>
              {b.items.map((item, idx) => (
                <li key={idx}>{tokenizeInline(item)}</li>
              ))}
            </ol>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={i}>
              {b.items.map((item, idx) => (
                <li key={idx}>{tokenizeInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === "hr") {
          return (
            <hr
              key={i}
              style={{
                border: "none",
                borderTop: "1px solid var(--rule)",
                margin: "8px 0",
              }}
            />
          );
        }
        if (b.kind === "footer") {
          return (
            <p key={i} style={{ color: "var(--fg-3)", fontSize: 13 }}>
              <em>{b.text}</em>
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
