import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNED_URL_TTL_SECONDS = 60;

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

  const { data: version, error: versionErr } = await supabase
    .from("contract_versions")
    .select("pdf_path,version,contract_id")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionErr) {
    return NextResponse.json(
      { error: "Failed to look up contract", detail: versionErr.message },
      { status: 500 },
    );
  }

  if (!version || !version.pdf_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("contracts")
    .createSignedUrl(version.pdf_path, SIGNED_URL_TTL_SECONDS);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to sign URL", detail: signErr?.message },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 });
}
