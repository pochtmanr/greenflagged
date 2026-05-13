import { NextResponse } from "next/server";
import { loadBusinessProfile } from "@/lib/contracts/business";
import { renderContractDocx } from "@/lib/docx/render";
import { fetchLogo } from "@/lib/pdf/logo";
import { coerceStyle } from "@/lib/pdf/themes";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
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

  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select("id, title, style, business_profile_id")
    .eq("id", id)
    .maybeSingle();
  if (cErr || !contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: version, error: vErr } = await supabase
    .from("contract_versions")
    .select("body_md")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (vErr || !version?.body_md) {
    return NextResponse.json({ error: "No contract body" }, { status: 404 });
  }

  const style = coerceStyle(contract.style);
  const business = await loadBusinessProfile(supabase, contract.business_profile_id);
  const logo =
    business?.logo_path && style.logo_placement !== "none"
      ? await fetchLogo(supabase, business.logo_path)
      : null;

  let docx: Buffer;
  try {
    docx = await renderContractDocx({
      body_md: version.body_md,
      title: contract.title ?? "Contract",
      style,
      logo_buffer: logo?.buffer,
      business: business ?? undefined,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to render DOCX",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const filename = sanitizeFilename(contract.title ?? "contract") + ".docx";
  return new NextResponse(new Uint8Array(docx), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "contract";
}
