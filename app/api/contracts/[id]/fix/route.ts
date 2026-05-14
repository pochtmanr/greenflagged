import { NextResponse } from "next/server";
import { complete } from "@/lib/ai/complete";
import type { Redline } from "@/lib/ai/review";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SYSTEM_FIX = `You are a contract editor for Green Flagged. The user just had
their contract reviewed and wants a revised version with the suggested redlines
applied.

Apply each redline to the original contract: replace the problematic clause
language with the suggested replacement, and integrate it cleanly into the
surrounding text. Preserve every unchanged section verbatim — do NOT rewrite or
restructure parts that aren't covered by a redline.

Output the revised contract as clean Markdown:
- Start with a single \`# Title\` heading.
- Use \`## Section\` for section headings.
- Plain English in the body. No legalese unless the original had it.
- Number lists where the original had numbering.

Output ONLY the markdown body. No commentary. No code fences. No prefix.`;

function buildUserPrompt(text: string, redlines: Redline[]): string {
  const list = redlines
    .map(
      (r, i) =>
        `${i + 1}. [${r.severity.toUpperCase()}]\n   Excerpt: "${r.clause_excerpt}"\n   Issue: ${r.issue}\n   Suggested replacement: ${r.suggestion}`,
    )
    .join("\n\n");

  return `Original contract:\n\n${text}\n\n---\n\nApply these redlines:\n\n${list}`;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select("id, owner_id, kind, title")
    .eq("id", id)
    .maybeSingle();

  if (cErr || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }
  if (contract.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contract.kind !== "scanned") {
    return NextResponse.json(
      { error: "Fix is only available for scanned contracts" },
      { status: 400 },
    );
  }

  const { data: scan, error: sErr } = await supabase
    .from("scans")
    .select("source_text, redlines")
    .eq("contract_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sErr || !scan) {
    return NextResponse.json({ error: "No scan found" }, { status: 404 });
  }

  const sourceText =
    typeof scan.source_text === "string" ? scan.source_text.trim() : "";
  if (!sourceText) {
    return NextResponse.json(
      {
        error:
          "This scan was created before fix support — re-scan the contract to enable revisions.",
      },
      { status: 400 },
    );
  }

  const redlines = Array.isArray(scan.redlines)
    ? (scan.redlines as Redline[])
    : [];
  if (redlines.length === 0) {
    return NextResponse.json(
      { error: "Nothing to fix — this scan has no redlines." },
      { status: 400 },
    );
  }

  let revised: string;
  try {
    revised = await complete({
      system: SYSTEM_FIX,
      user: buildUserPrompt(sourceText, redlines),
      maxTokens: 8000,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI rewrite failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const body_md = revised.trim();
  if (!body_md) {
    return NextResponse.json(
      { error: "AI returned an empty document" },
      { status: 502 },
    );
  }

  const baseTitle = contract.title?.trim() || "Contract";
  const revisedTitle = `${baseTitle} — revised`;

  const insertContract = await supabase
    .from("contracts")
    .insert({
      owner_id: user.id,
      kind: "drafted",
      title: revisedTitle,
      source_contract_id: contract.id,
    })
    .select("id")
    .single();

  if (insertContract.error || !insertContract.data) {
    return NextResponse.json(
      {
        error: `Failed to create revised contract: ${insertContract.error?.message ?? "unknown"}`,
      },
      { status: 500 },
    );
  }

  const newId = insertContract.data.id;

  const insertVersion = await supabase.from("contract_versions").insert({
    contract_id: newId,
    version: 1,
    body_md,
  });

  if (insertVersion.error) {
    await supabase.from("contracts").delete().eq("id", newId);
    return NextResponse.json(
      { error: `Failed to save version: ${insertVersion.error.message}` },
      { status: 500 },
    );
  }

  await supabase.from("usage_events").insert({
    user_id: user.id,
    kind: "draft",
    contract_id: newId,
  });

  return NextResponse.json({ contract_id: newId });
}
