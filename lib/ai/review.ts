import type { VerdictSeverity } from "@/lib/supabase/types";
import { claude, MODELS } from "./claude";

const SYSTEM_REVIEW = `You are a contract reviewer for Green Flagged. The user
is a freelancer or small business owner who may sign this contract. Be candid
and specific. Use plain English — never legalese without explaining it.

For the given contract text, produce a JSON response with EXACTLY this shape:

{
  "severity": "green" | "yellow" | "orange" | "red",
  "verdict_md": "<markdown — 3-6 short paragraphs summarizing what's good, what's risky, what to push back on>",
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
      "clause_excerpt": "<the original clause text, up to ~300 chars>",
      "issue":          "<plain-language explanation of what's wrong>",
      "suggestion":     "<exact replacement language to propose>",
      "severity":       "green|yellow|orange|red"
    }
  ]
}

Severity guide:
- green:  contract is balanced, low risk
- yellow: minor issues, push back if you can
- orange: significant red flags, negotiate before signing
- red:    do not sign without changes, multiple unfair terms

Output ONLY the JSON object. No prose before or after. No markdown code fences.`;

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

export async function reviewContract(text: string): Promise<ReviewResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Contract text is empty");

  const first = await callModel(trimmed);
  const parsed = tryParse(first);
  if (parsed) return validate(parsed);

  // Retry once with an explicit JSON-only instruction. Sonnet rarely needs this,
  // but it's cheap insurance and keeps the route from 500-ing on a bad token.
  const retry = await callModel(trimmed, true);
  const reparsed = tryParse(retry);
  if (!reparsed) {
    throw new Error("AI response was not valid JSON after retry");
  }
  return validate(reparsed);
}

async function callModel(text: string, strictRetry = false): Promise<string> {
  const userContent = strictRetry
    ? `Your previous response was not valid JSON. Return ONLY a valid JSON object matching the schema in the system prompt — no commentary, no code fences.\n\nContract:\n${text}`
    : text;

  const msg = await claude.messages.create({
    model: MODELS.review,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_REVIEW,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const block = msg.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Unexpected Anthropic response: no text block");
  }
  return block.text;
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
