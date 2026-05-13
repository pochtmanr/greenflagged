import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1A1A19",
    lineHeight: 1.55,
  },
  h1: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Oblique",
    color: "#5C5C58",
    marginBottom: 20,
  },
  h2: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 6,
  },
  para: { marginBottom: 8 },
  bullet: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { width: 18 },
  bulletBody: { flex: 1 },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#D9D7CE",
    marginVertical: 14,
  },
  footer: {
    marginTop: 14,
    fontSize: 9,
    color: "#8A8780",
    fontFamily: "Helvetica-Oblique",
  },
});

type Block =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "subtitle"; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string }
  | { kind: "hr" }
  | { kind: "footer"; text: string };

function parseMarkdown(md: string): Block[] {
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
      for (const line of lines) {
        out.push({ kind: "li", text: line.replace(/^\d+\.\s+/, "") });
      }
      continue;
    }
    if (allBulleted) {
      for (const line of lines) {
        out.push({ kind: "li", text: line.replace(/^[-*]\s+/, "") });
      }
      continue;
    }

    out.push({ kind: "p", text: lines.join(" ") });
  }

  return out;
}

type InlineSegment = { text: string; bold?: boolean; italic?: boolean };

function parseInline(text: string): InlineSegment[] {
  const segs: InlineSegment[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    if (start > lastIndex) segs.push({ text: text.slice(lastIndex, start) });
    const tok = match[0];
    if (tok.startsWith("**")) {
      segs.push({ text: tok.slice(2, -2), bold: true });
    } else {
      segs.push({ text: tok.slice(1, -1), italic: true });
    }
    lastIndex = start + tok.length;
  }
  if (lastIndex < text.length) segs.push({ text: text.slice(lastIndex) });
  return segs;
}

function InlineText({ value }: { value: string }) {
  const segs = parseInline(value);
  return (
    <>
      {segs.map((seg, i) => {
        const fontFamily = seg.bold
          ? "Helvetica-Bold"
          : seg.italic
            ? "Helvetica-Oblique"
            : "Helvetica";
        return (
          <Text key={i} style={{ fontFamily }}>
            {seg.text}
          </Text>
        );
      })}
    </>
  );
}

export async function renderContractPdf(
  markdown: string,
  fallbackTitle: string,
): Promise<Buffer> {
  const blocks = parseMarkdown(markdown);
  const titleBlock = blocks.find((b) => b.kind === "h1");
  const title = titleBlock?.text ?? fallbackTitle;
  const body = blocks.filter((b) => b !== titleBlock);

  const doc = (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{title}</Text>
        {body.map((b, i) => {
          if (b.kind === "subtitle") {
            return (
              <Text key={i} style={styles.subtitle}>
                {b.text}
              </Text>
            );
          }
          if (b.kind === "h2") {
            return (
              <Text key={i} style={styles.h2}>
                {b.text}
              </Text>
            );
          }
          if (b.kind === "p") {
            return (
              <Text key={i} style={styles.para}>
                <InlineText value={b.text} />
              </Text>
            );
          }
          if (b.kind === "li") {
            const ordinal = ordinalFor(body, i);
            return (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>{ordinal}</Text>
                <Text style={styles.bulletBody}>
                  <InlineText value={b.text} />
                </Text>
              </View>
            );
          }
          if (b.kind === "hr") {
            return <View key={i} style={styles.hr} />;
          }
          if (b.kind === "footer") {
            return (
              <Text key={i} style={styles.footer}>
                {b.text}
              </Text>
            );
          }
          return null;
        })}
      </Page>
    </Document>
  );

  const data = await renderToBuffer(doc);
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(data as unknown as Uint8Array);
}

function ordinalFor(blocks: Block[], currentIndex: number): string {
  let count = 0;
  for (let i = 0; i <= currentIndex; i += 1) {
    const b = blocks[i];
    if (!b) continue;
    if (b.kind === "h2") {
      count = 0;
      continue;
    }
    if (b.kind === "li") count += 1;
  }
  return `${count}.`;
}
