import type { VerdictSeverity } from "@/lib/supabase/types";
import { complete } from "./complete";

const SYSTEM_REVIEW = `You are a contract reviewer for Green Flagged. The reader
is a freelancer or small business owner deciding whether to sign. Be candid,
specific, and brief. Plain English. Explain any legalese you must use.

Return EXACTLY this JSON shape (no prose, no code fences):

{
  "severity": "green" | "yellow" | "orange" | "red",
  "verdict_md": "<markdown, see rules below>",
  "taxonomy": {
    "ip_ownership":  { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "payment_terms": { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "termination":   { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "nda_scope":     { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "liability_cap": { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "jurisdiction":  { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "auto_renewal":  { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "kill_fees":     { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "exclusivity":   { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" }
  },
  "redlines": [
    {
      "clause_excerpt": "<verbatim clause text from the contract, up to ~300 chars>",
      "issue":          "<plain-language explanation of what's wrong>",
      "suggestion":     "<exact replacement language to propose>",
      "severity":       "green|yellow|orange|red"
    }
  ]
}

Rules for verdict_md:
- 3 to 5 short paragraphs. Each paragraph ≤ 70 words.
- Paragraph 1: one-sentence verdict that names the single biggest risk. No throat-clearing.
- Middle paragraphs: one material risk each. Quote the actual clause inline using "double quotes" so the reader can find it. Then say what to do about it in concrete terms (specific number, specific clause name, specific edit).
- Final paragraph: what to do next — sign, negotiate, or walk — and the top 1-2 asks to send back.
- Every claim of risk must be tied to a quoted phrase from the contract. If you cannot quote it, do not claim it.
- If a section is missing (e.g. no liability cap), say "the contract has no liability cap" — do not invent a quote.
- Banned openers and filler: "Overall", "This contract", "fairly standard", "straightforward", "However there are", "Key items to push back on include", "It is important to note", "robust". Start somewhere else.
- Proofread before emitting. No misspellings or invented words.

Rules for taxonomy.summary: one short sentence. If present, quote a key phrase. If absent, say so plainly.

Rules for redlines:
- clause_excerpt MUST be verbatim from the contract — do not paraphrase, do not invent.
- issue: 1-2 sentences naming the concrete harm to the signer.
- suggestion: drop-in replacement language the user can paste into a redline. Not a description of what to change — the actual replacement text.
- Order redlines by severity (red first), max 8 entries. Skip cosmetic issues.

Severity guide:
- green:  balanced, low risk
- yellow: minor issues, push back if you can
- orange: significant red flags, negotiate before signing
- red:    do not sign without changes, multiple unfair terms

Output ONLY the JSON object.`;

export type TaxonomyEntry = {
  present: boolean;
  summary: string;
  severity: VerdictSeverity;
};

export type Redline = {
  clause_excerpt: string;
  issue: string;
  suggestion: string;
  severity: VerdictSeverity;
};

export type ReviewResult = {
  severity: VerdictSeverity;
  verdict_md: string;
  taxonomy: Record<string, TaxonomyEntry>;
  redlines: Redline[];
};

const REVIEW_KEYS = [
  "ip_ownership",
  "payment_terms",
  "termination",
  "nda_scope",
  "liability_cap",
  "jurisdiction",
  "auto_renewal",
  "kill_fees",
  "exclusivity",
] as const;

export async function reviewContract(
  text: string,
  modelId?: string,
): Promise<ReviewResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Contract text is empty");

  const first = await callModel(trimmed, modelId);
  const parsed = tryParse(first);
  if (parsed) return validate(parsed);

  const retry = await callModel(trimmed, modelId, true);
  const reparsed = tryParse(retry);
  if (!reparsed) {
    throw new Error("AI response was not valid JSON after retry");
  }
  return validate(reparsed);
}

async function callModel(
  text: string,
  modelId?: string,
  strictRetry = false,
): Promise<string> {
  const userContent = strictRetry
    ? `Your previous response was not valid JSON. Return ONLY a valid JSON object matching the schema in the system prompt — no commentary, no code fences.\n\nContract:\n${text}`
    : text;

  return complete({
    model: modelId,
    system: SYSTEM_REVIEW,
    user: userContent,
    maxTokens: 4096,
    json: true,
  });
}

function tryParse(raw: string): unknown {
  const trimmed = raw.trim();
  // Tolerate a stray code fence even though the prompt forbids it.
  const stripped = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

function validate(parsed: unknown): ReviewResult {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Review response is not an object");
  }
  const obj = parsed as Record<string, unknown>;
  const severity = obj.severity;
  if (!isSeverity(severity)) {
    throw new Error(`Invalid severity: ${String(severity)}`);
  }
  const verdict_md = typeof obj.verdict_md === "string" ? obj.verdict_md : "";
  const taxonomyIn =
    obj.taxonomy && typeof obj.taxonomy === "object"
      ? (obj.taxonomy as Record<string, unknown>)
      : {};
  const taxonomy: Record<string, TaxonomyEntry> = {};
  for (const key of REVIEW_KEYS) {
    const entry = taxonomyIn[key];
    taxonomy[key] = coerceTaxonomyEntry(entry);
  }
  const redlines = Array.isArray(obj.redlines)
    ? obj.redlines.map(coerceRedline).filter(Boolean) as Redline[]
    : [];
  return { severity, verdict_md, taxonomy, redlines };
}

function coerceTaxonomyEntry(value: unknown): TaxonomyEntry {
  if (!value || typeof value !== "object") {
    return { present: false, summary: "", severity: "green" };
  }
  const obj = value as Record<string, unknown>;
  const sev = isSeverity(obj.severity) ? obj.severity : "green";
  return {
    present: obj.present === true,
    summary: typeof obj.summary === "string" ? obj.summary : "",
    severity: sev,
  };
}

function coerceRedline(value: unknown): Redline | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const severity = isSeverity(obj.severity) ? obj.severity : "yellow";
  return {
    clause_excerpt:
      typeof obj.clause_excerpt === "string" ? obj.clause_excerpt : "",
    issue: typeof obj.issue === "string" ? obj.issue : "",
    suggestion: typeof obj.suggestion === "string" ? obj.suggestion : "",
    severity,
  };
}

function isSeverity(v: unknown): v is VerdictSeverity {
  return v === "green" || v === "yellow" || v === "orange" || v === "red";
}
