import "./pdf-polyfill";
import { PDFParse } from "pdf-parse";

export async function extractPdfText(buf: Buffer): Promise<string> {
  const data = new Uint8Array(buf);
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return normalize(result.text);
  } finally {
    await parser.destroy().catch(() => {});
  }
}

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
