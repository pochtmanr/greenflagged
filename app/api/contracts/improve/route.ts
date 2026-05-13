import { NextResponse } from "next/server";
import { z } from "zod";
import { claude, MODELS } from "@/lib/ai/claude";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  text: z.string().min(1).max(4000),
  field_kind: z.enum(["scope", "deliverables"]),
});

const SYSTEMS: Record<"scope" | "deliverables", string> = {
  scope: `You rewrite freelancer scope-of-work descriptions into professional contract language. Keep the same meaning and concrete details. Use clear, specific, unambiguous wording. Avoid legalese. Output the rewritten text only — no preamble, no explanation, no markdown headers. 2-6 sentences max.`,
  deliverables: `You rewrite freelancer deliverable lists into clear, itemized contract language. Output a numbered markdown list (1. 2. 3.) of concrete outputs. No preamble. No explanation. If the input is already a list, keep the items but tighten language. If the input is prose, extract discrete deliverables.`,
};

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { text, field_kind } = parsed.data;

  try {
    const msg = await claude.messages.create({
      model: MODELS.draft,
      max_tokens: 1024,
      system: [
        {
          type: "text",
          text: SYSTEMS[field_kind],
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: text }],
    });
    const block = msg.content[0];
    if (!block || block.type !== "text") {
      return NextResponse.json(
        { error: "ai_response_invalid" },
        { status: 502 },
      );
    }
    return NextResponse.json({ improved: block.text.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ai_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
