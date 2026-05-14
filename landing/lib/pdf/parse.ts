// Shared minimal markdown parser used by both PDF and DOCX renderers.
// Handles bold, italic, headings (h1/h2/h3), paragraphs, numbered + bulleted
// lists, horizontal rules, footer-style italic blocks, and inline links.

export type Block =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "subtitle"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ol"; items: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "hr" }
  | { kind: "footer"; text: string };

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string }
  | { kind: "italic"; text: string }
  | { kind: "link"; text: string; href: string };

export function parseMarkdown(md: string): Block[] {
  const out: Block[] = [];
  const paragraphs = md.replace(/\r\n/g, "\n").split(/\n\s*\n/);

  for (const raw of paragraphs) {
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
    if (para.startsWith("### ")) {
      out.push({ kind: "h3", text: para.replace(/^###\s+/, "") });
      continue;
    }
    if (para === "---" || para === "***" || para === "___") {
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

    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    const allNumbered = lines.length > 0 && lines.every((l) => /^\d+\.\s+/.test(l));
    const allBulleted = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));

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

export function parseInline(text: string): Inline[] {
  const segs: Inline[] = [];
  // Order: link, bold, italic.
  const re = /(\[([^\]]+)\]\((https?:[^)]+)\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    if (start > lastIndex) segs.push({ kind: "text", text: text.slice(lastIndex, start) });
    const tok = match[0];
    if (tok.startsWith("[")) {
      const label = match[2] ?? tok;
      const href = match[3] ?? "";
      segs.push({ kind: "link", text: label, href });
    } else if (tok.startsWith("**")) {
      segs.push({ kind: "bold", text: tok.slice(2, -2) });
    } else {
      segs.push({ kind: "italic", text: tok.slice(1, -1) });
    }
    lastIndex = start + tok.length;
  }
  if (lastIndex < text.length) {
    segs.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return segs;
}

// Best-effort split of a flat block list into two roughly equal halves
// at section boundaries. We avoid splitting in the middle of an `ol`/`ul`
// or between consecutive paragraphs without a heading separator.
export function splitForTwoColumns(blocks: Block[]): [Block[], Block[]] {
  if (blocks.length < 4) return [blocks, []];

  const breakpoints: number[] = [];
  for (let i = 1; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (b.kind === "h2" || b.kind === "h3" || b.kind === "hr") {
      breakpoints.push(i);
    }
  }
  if (breakpoints.length === 0) {
    // Fallback: split at the midpoint by block count
    const mid = Math.floor(blocks.length / 2);
    return [blocks.slice(0, mid), blocks.slice(mid)];
  }
  const target = blocks.length / 2;
  let best = breakpoints[0];
  let bestDelta = Math.abs(best - target);
  for (const bp of breakpoints) {
    const delta = Math.abs(bp - target);
    if (delta < bestDelta) {
      best = bp;
      bestDelta = delta;
    }
  }
  return [blocks.slice(0, best), blocks.slice(best)];
}
