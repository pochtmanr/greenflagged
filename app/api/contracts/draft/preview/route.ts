import { NextResponse } from "next/server";
import { z } from "zod";
import { getIndustry } from "@/lib/contracts";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  industry: z.string().min(1),
  answers: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  let payload;
  try {
    payload = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", detail: err instanceof Error ? err.message : String(err) },
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

  const schema = getIndustry(payload.industry);
  if (!schema) {
    return NextResponse.json(
      { error: `Unknown industry "${payload.industry}"` },
      { status: 400 },
    );
  }

  const parsed = schema.validator.safeParse(payload.answers);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid answers",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const data = parsed.data as Record<string, unknown>;
  return NextResponse.json({
    body_md: schema.render(data),
    title: schema.buildTitle(data),
  });
}
