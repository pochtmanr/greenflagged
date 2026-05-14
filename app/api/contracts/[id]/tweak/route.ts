import { NextResponse } from "next/server";
import { z } from "zod";
import { complete } from "@/lib/ai/complete";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const BodySchema = z.object({
  instruction: z.string().trim().min(1).max(8000),
});

const TWEAK_SYSTEM = `You revise an existing contract markdown document according to the user's instruction. CRITICAL RULES:

1. Output ONLY the full revised markdown of the contract. No commentary, no wrapper.
2. Preserve the existing structure, clause numbering, and party/role labels.
3. Insert, refine, or rephrase clauses to satisfy the instruction. Do not delete entire clauses unless the user explicitly says to remove them.
4. Do not change personal names, addresses, currency amounts, dates, or any other user-supplied content unless the instruction explicitly tells you to.
5. Match the tone, formality, and markdown formatting of the existing document.
6. If the instruction asks for content that would conflict with the existing clauses, add a new clause that resolves the conflict explicitly rather than silently editing the conflicting clause.

Output the full contract markdown, ready to replace the existing version.`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let payload: { instruction: string };
  try {
    payload = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid body",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!contract || contract.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: latest } = await supabase
    .from("contract_versions")
    .select("body_md")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest?.body_md) {
    return NextResponse.json({ error: "No contract body" }, { status: 404 });
  }

  const userPrompt = `Current contract markdown:

${latest.body_md}

---

User instruction:
${payload.instruction}`;

  let revised: string;
  try {
    revised = await complete({
      // No explicit model — defaults to gpt-5.4-mini via lib/ai/models.ts.
      system: TWEAK_SYSTEM,
      user: userPrompt,
      maxTokens: 16000,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "tweak_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    body_md: revised.trim(),
    previous_body_md: latest.body_md,
  });
}
