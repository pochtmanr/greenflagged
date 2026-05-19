// IMPORTANT — import order matters. pdf-parse/worker has side effects that
// must run before pdf-parse loads pdfjs-dist:
//   1. global.DOMMatrix = DOMMatrix (from @napi-rs/canvas) so pdfjs's
//      top-level matrix references resolve in Node serverless runtime.
//   2. getData() returns the pdfjs worker as a base64 data URL, which we
//      pass to PDFParse.setWorker() to avoid the default fake-worker path
//      that dynamically imports pdf.worker.mjs from node_modules — that
//      file isn't traced into the Vercel function bundle and the import
//      fails with "Cannot find module .../pdf.worker.mjs".
import { getData } from "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

PDFParse.setWorker(getData());

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
