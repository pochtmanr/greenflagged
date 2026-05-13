import { extractDocxText } from "./docx";
import { extractPdfText } from "./pdf";

export const MAX_TEXT_BYTES = 200 * 1024;
export const TRUNCATION_MARKER =
  "\n\n[…truncated for review — contract exceeds 200KB of extracted text…]";

export type ExtractResult = {
  text: string;
  truncated: boolean;
  bytesIn: number;
};

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export async function extractContractText(file: File): Promise<ExtractResult> {
  const buf = Buffer.from(await file.arrayBuffer());
  const type = file.type || guessFromName(file.name);
  const raw = await extractByType(buf, type);
  return truncate(raw);
}

export function truncate(raw: string): ExtractResult {
  const bytes = Buffer.byteLength(raw, "utf-8");
  if (bytes <= MAX_TEXT_BYTES) {
    return { text: raw, truncated: false, bytesIn: bytes };
  }
  const slice = Buffer.from(raw, "utf-8")
    .subarray(0, MAX_TEXT_BYTES)
    .toString("utf-8");
  return {
    text: slice + TRUNCATION_MARKER,
    truncated: true,
    bytesIn: bytes,
  };
}

async function extractByType(buf: Buffer, type: string): Promise<string> {
  if (type === PDF_MIME) return extractPdfText(buf);
  if (type === DOCX_MIME) return extractDocxText(buf);
  if (type.startsWith("text/")) return buf.toString("utf-8").trim();
  throw new Error(`Unsupported file type: ${type}`);
}

function guessFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return PDF_MIME;
  if (lower.endsWith(".docx")) return DOCX_MIME;
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "text/plain";
  return "application/octet-stream";
}

export function extensionFor(type: string): string {
  if (type === PDF_MIME) return "pdf";
  if (type === DOCX_MIME) return "docx";
  if (type.startsWith("text/")) return "txt";
  return "bin";
}
