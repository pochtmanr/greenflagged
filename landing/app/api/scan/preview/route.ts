import { NextResponse } from "next/server";
import { reviewContract, type Redline } from "@/lib/ai/review";
import { extractContractText, truncate } from "@/lib/parse";
import { getSupabaseServiceRole } from "@/lib/supabase/server";
import type { VerdictSeverity } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public hero-funnel preview: no auth, no persistence of contract content,
// strict per-IP soft rate-limit. Returns a teaser verdict; the full report
// is gated behind sign-up.

// Preview runs on the same default model as the authed /scan route — see
// lib/ai/models.ts (gpt-5.4-mini).
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
const PREVIEW_MODEL_ID = DEFAULT_MODEL_ID;

const MAX_PREVIEW_CHARS = 30_000;
const MAX_PREVIEW_FILE_BYTES = 5 * 1024 * 1024; // 5MB for free preview uploads
const MAX_PER_IP_PER_DAY = 3;

type PreviewResponse = {
  severity: VerdictSeverity;
  headline: string;
  total_flags: number;
  flag_counts: Record<VerdictSeverity, number>;
  first_flag: { excerpt: string; issue: string } | null;
  redlines_locked: number;
};

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function firstSentence(md: string): string {
  const stripped = md
    .replace(/^>.*$/gm, "")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return "Your contract has been reviewed.";
  const match = stripped.match(/^(.+?[.!?])\s/);
  const candidate = (match ? match[1] : stripped).trim();
  return candidate.length > 220 ? candidate.slice(0, 217) + "…" : candidate;
}

function countFlags(redlines: Redline[]): Record<VerdictSeverity, number> {
  const counts: Record<VerdictSeverity, number> = {
    green: 0,
    yellow: 0,
    orange: 0,
    red: 0,
  };
  for (const r of redlines) counts[r.severity]++;
  return counts;
}

function firstSerious(redlines: Redline[]): Redline | null {
  return (
    redlines.find((r) => r.severity === "red") ??
    redlines.find((r) => r.severity === "orange") ??
    redlines.find((r) => r.severity === "yellow") ??
    redlines[0] ??
    null
  );
}

type ReadResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string; code?: string };

async function readPreviewPayload(req: Request): Promise<ReadResult> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return { ok: false, status: 400, error: "Invalid form data" };
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      const raw = typeof form.get("text") === "string" ? (form.get("text") as string).trim() : "";
      if (!raw) {
        return { ok: false, status: 400, error: "Attach a file or paste text" };
      }
      return validateText(raw);
    }
    if (file.size === 0) {
      return { ok: false, status: 400, error: "Uploaded file is empty" };
    }
    if (file.size > MAX_PREVIEW_FILE_BYTES) {
      return {
        ok: false,
        status: 413,
        error: "Free preview accepts files up to 5MB. Sign up free for the full 10MB limit.",
        code: "preview_file_too_large",
      };
    }
    try {
      const extracted = await extractContractText(file);
      return validateText(extracted.text);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to parse file";
      return { ok: false, status: 415, error: message };
    }
  }

  if (contentType.includes("application/json")) {
    let body: { text?: unknown };
    try {
      body = (await req.json()) as { text?: unknown };
    } catch {
      return { ok: false, status: 400, error: "Invalid JSON body" };
    }
    const raw = typeof body.text === "string" ? body.text.trim() : "";
    return validateText(raw);
  }

  return {
    ok: false,
    status: 415,
    error: "Send application/json with { text } or multipart/form-data with file",
  };
}

function validateText(raw: string): ReadResult {
  if (raw.length < 200) {
    return {
      ok: false,
      status: 400,
      error: "Paste at least a paragraph of your contract (200+ characters).",
    };
  }
  if (raw.length > MAX_PREVIEW_CHARS) {
    return {
      ok: false,
      status: 413,
      error:
        "Preview is capped at 30,000 characters. Sign up free to scan longer contracts.",
      code: "preview_too_long",
    };
  }
  return { ok: true, text: raw };
}

export async function POST(req: Request) {
  const payload = await readPreviewPayload(req);
  if (!payload.ok) {
    return NextResponse.json(
      payload.code ? { error: payload.error, code: payload.code } : { error: payload.error },
      { status: payload.status },
    );
  }

  const ip = clientIp(req);
  const admin = getSupabaseServiceRole();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("preview_events")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);

  if (countError) {
    // Fail open — we'd rather serve the preview than lose a conversion to a
    // transient DB hiccup. The lib client will throw with a clear message if
    // env vars are missing in production.
    console.warn("preview_events count failed", countError.message);
  } else if ((count ?? 0) >= MAX_PER_IP_PER_DAY) {
    return NextResponse.json(
      {
        error:
          "Free preview limit reached for today. Sign up free to keep scanning.",
        code: "rate_limited",
      },
      { status: 429 },
    );
  }

  const extracted = truncate(payload.text);

  let result;
  try {
    result = await reviewContract(extracted.text, PREVIEW_MODEL_ID);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI review failed";
    return NextResponse.json(
      { error: message, code: "ai_review_failed" },
      { status: 502 },
    );
  }

  await admin.from("preview_events").insert({
    ip,
    severity: result.severity,
  });

  const counts = countFlags(result.redlines);
  const teaser = firstSerious(result.redlines);
  const totalFlags =
    counts.red + counts.orange + counts.yellow + counts.green;

  const response: PreviewResponse = {
    severity: result.severity,
    headline: firstSentence(result.verdict_md),
    total_flags: totalFlags,
    flag_counts: counts,
    first_flag: teaser
      ? {
          excerpt:
            teaser.clause_excerpt.length > 240
              ? teaser.clause_excerpt.slice(0, 237) + "…"
              : teaser.clause_excerpt,
          issue: teaser.issue,
        }
      : null,
    redlines_locked: Math.max(totalFlags - (teaser ? 1 : 0), 0),
  };

  return NextResponse.json(response);
}
