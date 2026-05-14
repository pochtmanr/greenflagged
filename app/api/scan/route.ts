import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { reviewContract } from "@/lib/ai/review";
import { extensionFor, extractContractText, truncate } from "@/lib/parse";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB hard cap on uploads
const MAX_PASTED_CHARS = 250_000;

type ScanError = { error: string; code?: string };

function bad(error: string, status = 400, code?: string) {
  return NextResponse.json<ScanError>({ error, code }, { status });
}

function deriveTitle(text: string, fallback: string): string {
  for (const line of text.split(/\r?\n/)) {
    const candidate = line.trim();
    if (candidate.length >= 4) {
      return candidate.slice(0, 120);
    }
  }
  return fallback;
}

async function readPayload(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    const model = typeof form.get("model") === "string" ? (form.get("model") as string) : null;
    if (!(file instanceof File)) {
      return { error: bad("Missing file in form data") };
    }
    if (file.size === 0) return { error: bad("Uploaded file is empty") };
    if (file.size > MAX_FILE_BYTES) {
      return { error: bad("File exceeds 10MB upload limit", 413) };
    }
    const extracted = await extractContractText(file).catch((err) => {
      const message =
        err instanceof Error ? err.message : "Failed to parse file";
      return { error: bad(message, 415) } as const;
    });
    if ("error" in extracted) return extracted;
    return {
      file,
      text: extracted.text,
      truncated: extracted.truncated,
      bytesIn: extracted.bytesIn,
      model,
    };
  }

  if (contentType.includes("application/json")) {
    let body: { text?: unknown; model?: unknown };
    try {
      body = (await req.json()) as { text?: unknown; model?: unknown };
    } catch {
      return { error: bad("Invalid JSON body") };
    }
    const raw = typeof body.text === "string" ? body.text.trim() : "";
    if (!raw) return { error: bad("Paste at least a paragraph of contract text") };
    if (raw.length > MAX_PASTED_CHARS) {
      return { error: bad("Pasted text is too long", 413) };
    }
    const model = typeof body.model === "string" ? body.model : null;
    const extracted = truncate(raw);
    return {
      file: null,
      text: extracted.text,
      truncated: extracted.truncated,
      bytesIn: extracted.bytesIn,
      model,
    };
  }

  return { error: bad("Unsupported Content-Type", 415) };
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return bad("Sign in required", 401, "unauthenticated");
  }

  const payload = await readPayload(req);
  if ("error" in payload) return payload.error;

  const { file, text, truncated, model } = payload;
  if (!text.trim()) {
    return bad("No readable text found in the contract", 422);
  }

  const contractId = randomUUID();
  const title = deriveTitle(text, file?.name ?? "Untitled contract");

  let storagePath: string | null = null;
  if (file) {
    const ext = extensionFor(file.type || "application/octet-stream");
    const path = `${user.id}/${contractId}/source.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const upload = await supabase.storage
      .from("contracts")
      .upload(path, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (upload.error) {
      return bad(`Storage upload failed: ${upload.error.message}`, 500);
    }
    storagePath = path;
  }

  const insertContract = await supabase
    .from("contracts")
    .insert({
      id: contractId,
      owner_id: user.id,
      kind: "scanned",
      title,
      storage_path: storagePath,
    })
    .select("id")
    .single();

  if (insertContract.error) {
    if (storagePath) {
      await supabase.storage.from("contracts").remove([storagePath]);
    }
    return bad(
      `Failed to create contract: ${insertContract.error.message}`,
      500
    );
  }

  let result;
  try {
    result = await reviewContract(text, model ?? undefined);
  } catch (err) {
    if (storagePath) {
      await supabase.storage.from("contracts").remove([storagePath]);
    }
    await supabase.from("contracts").delete().eq("id", contractId);
    const message = err instanceof Error ? err.message : "AI review failed";
    return bad(message, 502, "ai_review_failed");
  }

  const verdictMd = truncated
    ? `> Note: contract was truncated to 200KB for review. Re-upload a shorter version for full coverage.\n\n${result.verdict_md}`
    : result.verdict_md;

  const insertScan = await supabase.from("scans").insert({
    contract_id: contractId,
    taxonomy: result.taxonomy,
    verdict_md: verdictMd,
    redlines: result.redlines,
    source_text: text,
  });
  if (insertScan.error) {
    return bad(`Failed to save scan: ${insertScan.error.message}`, 500);
  }

  const updateVerdict = await supabase
    .from("contracts")
    .update({ verdict_severity: result.severity })
    .eq("id", contractId);
  if (updateVerdict.error) {
    return bad(
      `Failed to update verdict severity: ${updateVerdict.error.message}`,
      500
    );
  }

  await supabase.from("usage_events").insert({
    user_id: user.id,
    kind: "scan",
    contract_id: contractId,
  });

  return NextResponse.json({ contract_id: contractId, severity: result.severity });
}
