// Helpers for fetching a business-profile logo from storage so we can
// embed it in PDF (as data URL) and DOCX (as Buffer).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const SIGNED_URL_TTL_SECONDS = 60;

export type LogoBundle = {
  buffer: Buffer;
  contentType: string;
  dataUrl: string;
};

export async function fetchLogo(
  supabase: SupabaseClient<Database>,
  logoPath: string,
): Promise<LogoBundle | null> {
  // Try the public-API path first via signed URL (works for RLS-gated reads).
  const { data: signed, error } = await supabase.storage
    .from("contracts")
    .createSignedUrl(logoPath, SIGNED_URL_TTL_SECONDS);
  if (error || !signed?.signedUrl) return null;

  const res = await fetch(signed.signedUrl);
  if (!res.ok) return null;
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  const contentType =
    res.headers.get("content-type") ?? sniffContentType(buffer);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${contentType};base64,${base64}`;
  return { buffer, contentType, dataUrl };
}

function sniffContentType(buffer: Buffer): string {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  )
    return "image/png";
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    return "image/jpeg";
  }
  return "application/octet-stream";
}
