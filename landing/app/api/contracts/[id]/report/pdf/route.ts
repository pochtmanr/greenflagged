import { NextResponse } from "next/server";
import type { Redline, TaxonomyEntry } from "@/lib/ai/review";
import { loadBusinessProfile } from "@/lib/contracts/business";
import { fetchLogo } from "@/lib/pdf/logo";
import { renderReportPdf } from "@/lib/pdf/render-report";
import { coerceStyle } from "@/lib/pdf/themes";
import { getSupabaseFromRequest } from "@/lib/supabase/server";
import type { VerdictSeverity } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sanitizeFilename(s: string): string {
  return (
    s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) ||
    "contract"
  );
}

export async function GET(
  _req: Request,
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

  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select(
      "id, owner_id, kind, title, verdict_severity, style, business_profile_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (cErr || !contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contract.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contract.kind !== "scanned") {
    return NextResponse.json(
      { error: "Report is only available for scanned contracts" },
      { status: 400 },
    );
  }

  const { data: scan, error: sErr } = await supabase
    .from("scans")
    .select("verdict_md, taxonomy, redlines, created_at")
    .eq("contract_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sErr || !scan) {
    return NextResponse.json({ error: "No scan found" }, { status: 404 });
  }

  const style = coerceStyle(contract.style);
  const business = await loadBusinessProfile(
    supabase,
    contract.business_profile_id,
  );
  const logo =
    business?.logo_path && style.logo_placement !== "none"
      ? await fetchLogo(supabase, business.logo_path)
      : null;

  const severity: VerdictSeverity = contract.verdict_severity ?? "yellow";
  const taxonomy =
    (scan.taxonomy as Record<string, TaxonomyEntry> | null) ?? {};
  const redlines = Array.isArray(scan.redlines)
    ? (scan.redlines as Redline[])
    : [];

  let pdf: Buffer;
  try {
    pdf = await renderReportPdf({
      title: contract.title ?? "Untitled contract",
      severity,
      reviewedAt: scan.created_at ?? contract.created_at,
      verdictMd: scan.verdict_md ?? "",
      taxonomy,
      redlines,
      style,
      logoDataUrl: logo?.dataUrl,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to render report",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const filename =
    sanitizeFilename(contract.title ?? "contract") + "-report.pdf";

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
