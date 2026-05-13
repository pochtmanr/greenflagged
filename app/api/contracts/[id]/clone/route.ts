import { NextResponse } from "next/server";
import { coerceStyle, DEFAULT_STYLE } from "@/lib/pdf/themes";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: source, error: sErr } = await supabase
    .from("contracts")
    .select("id, industry, title, style, business_profile_id, kind")
    .eq("id", id)
    .maybeSingle();
  if (sErr || !source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: latest, error: lErr } = await supabase
    .from("contract_versions")
    .select("body_md")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lErr || !latest?.body_md) {
    return NextResponse.json({ error: "Source has no body" }, { status: 400 });
  }

  const style = coerceStyle(source.style) ?? DEFAULT_STYLE;
  const newTitle = `${source.title ?? "Untitled contract"} (copy)`;

  const { data: inserted, error: iErr } = await supabase
    .from("contracts")
    .insert({
      owner_id: user.id,
      kind: "drafted",
      industry: source.industry,
      title: newTitle,
      style: style as unknown as Json,
      business_profile_id: source.business_profile_id,
      source_contract_id: source.id,
    })
    .select("id")
    .single();

  if (iErr || !inserted) {
    return NextResponse.json(
      { error: "Failed to clone contract", detail: iErr?.message },
      { status: 500 },
    );
  }

  const { error: vErr } = await supabase.from("contract_versions").insert({
    contract_id: inserted.id,
    version: 1,
    body_md: latest.body_md,
  });

  if (vErr) {
    // Best-effort rollback of the contract row
    await supabase.from("contracts").delete().eq("id", inserted.id);
    return NextResponse.json(
      { error: "Failed to seed cloned version", detail: vErr.message },
      { status: 500 },
    );
  }

  await supabase.from("usage_events").insert({
    user_id: user.id,
    kind: "draft",
    contract_id: inserted.id,
  });

  return NextResponse.json({ contract_id: inserted.id });
}
