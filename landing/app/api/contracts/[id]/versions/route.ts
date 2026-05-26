import { NextResponse } from "next/server";
import { z } from "zod";
import { coerceStyle } from "@/lib/pdf/themes";
import { getSupabaseFromRequest } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type ContractsUpdate = Database["public"]["Tables"]["contracts"]["Update"];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accepts both the current shape (`ink`/`brand`, `header_with_info`) and the
// retired legacy values (`sage`, `footer`). `coerceStyle` collapses the legacy
// cases before write, so storage stays in the current shape.
const StyleSchema = z
  .object({
    typography: z.enum(["editorial", "modern", "classic"]),
    accent: z.enum(["sage", "ink", "brand"]),
    layout: z.enum(["single", "two-column", "cover"]),
    logo_placement: z.enum([
      "header",
      "header_with_info",
      "footer",
      "cover",
      "none",
    ]),
    brand_color: z.string().optional(),
  })
  .strict();

const BodySchema = z.object({
  body_md: z.string().min(1, "body_md is required"),
  title: z.string().min(1).max(200).optional(),
  style: StyleSchema.optional(),
  business_profile_id: z.string().uuid().nullable().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: z.infer<typeof BodySchema>;
  try {
    payload = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  // Ownership check is enforced by RLS — the .eq("id", id) will return nothing
  // if the user doesn't own the row.
  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (cErr || !contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: latest } = await supabase
    .from("contract_versions")
    .select("version")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latest?.version ?? 0) + 1;

  const { data: inserted, error: vErr } = await supabase
    .from("contract_versions")
    .insert({
      contract_id: id,
      version: nextVersion,
      body_md: payload.body_md,
    })
    .select("id, version")
    .single();

  if (vErr || !inserted) {
    return NextResponse.json(
      { error: "Failed to record version", detail: vErr?.message },
      { status: 500 },
    );
  }

  const updates: ContractsUpdate = {};
  if (payload.title) updates.title = payload.title;
  if (payload.style) updates.style = coerceStyle(payload.style) as unknown as Json;
  if (payload.business_profile_id !== undefined) {
    updates.business_profile_id = payload.business_profile_id;
  }

  if (Object.keys(updates).length > 0) {
    const { error: updErr } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", id);
    if (updErr) {
      return NextResponse.json(
        { error: "Failed to update contract", detail: updErr.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    version: inserted.version,
    contract_version_id: inserted.id,
  });
}
