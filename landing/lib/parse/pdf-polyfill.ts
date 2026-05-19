// pdfjs-dist (transitively pulled in by pdf-parse) references DOMMatrix at
// module-load time. Vercel's serverless Node runtime has no DOMMatrix global,
// so the dynamic import in next.config's serverExternalPackages path throws
// ReferenceError before the API route handler can run, producing a bodyless
// framework 500.
//
// pdf-parse@2's getText() path never actually exercises the matrix transform
// code — it only reads text streams — so a no-op stub satisfies the type
// reference without affecting output.
//
// This file MUST be imported before pdf-parse. ESM hoists imports but
// evaluates them in source order, so `import "./pdf-polyfill"` followed by
// `import { PDFParse } from "pdf-parse"` is the correct pattern.

class DOMMatrixStub {}

const g = globalThis as { DOMMatrix?: unknown };
if (typeof g.DOMMatrix === "undefined") {
  g.DOMMatrix = DOMMatrixStub;
}

export {};
