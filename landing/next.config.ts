import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas"],
  // pdfjs-dist dynamically imports its worker (pdf.worker.mjs) when no
  // workerSrc is set; Vercel's file tracer can't see that reference and
  // omits the file from the function bundle, producing "Cannot find module
  // .../pdf.worker.mjs" at runtime. Force-include it for routes that parse
  // PDFs.
  outputFileTracingIncludes: {
    "/api/scan/**": [
      "./node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
  images: {
    qualities: [75, 85],
  },
};

export default nextConfig;
