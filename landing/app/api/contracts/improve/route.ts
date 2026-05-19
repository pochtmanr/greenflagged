import { NextResponse } from "next/server";
import { z } from "zod";
import { complete } from "@/lib/ai/complete";
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
    const out = await complete({
      system: SYSTEMS[field_kind],
      user: text,
      maxTokens: 1024,
    });
    return NextResponse.json({ improved: out.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ai_error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
