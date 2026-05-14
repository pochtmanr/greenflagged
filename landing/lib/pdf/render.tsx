// Deprecated shim — Phase 6 introduces the themed renderer.
// New callers should import { renderContractPdf } from "@/lib/pdf/render-themed".
// This file preserves the old `renderContractPdf(markdown, title)` signature
// so the wizard's existing call sites don't break, until they migrate.

import { renderContractPdf as renderThemed } from "./render-themed";
import { DEFAULT_STYLE } from "./themes";

export async function renderContractPdf(
  markdown: string,
  fallbackTitle: string,
): Promise<Buffer> {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() || fallbackTitle;
  return renderThemed({
    body_md: markdown,
    title,
    style: DEFAULT_STYLE,
  });
}
