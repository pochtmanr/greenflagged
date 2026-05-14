import { NextResponse } from "next/server";
import { loadBusinessProfile } from "@/lib/contracts/business";
import { isSupportedLocale } from "@/lib/contracts/i18n";
import { fetchLogo } from "@/lib/pdf/logo";
import { renderContractPdf } from "@/lib/pdf/render-themed";
import { coerceStyle } from "@/lib/pdf/themes";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const asDownload = url.searchParams.get("download") === "1";
  const localeParam = url.searchParams.get("locale");
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

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

  // body_md_translations is added in migration 0008; cast through any since
  // Supabase types may not be regenerated yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: version, error: vErr } = (await sb
    .from("contract_versions")
    .select("body_md, body_md_translations, version")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()) as {
    data: {
      body_md: string | null;
      body_md_translations: Record<string, string> | null;
      version: number;
    } | null;
    error: unknown;
  };

  if (vErr || !version?.body_md) {
    return NextResponse.json({ error: "No contract body" }, { status: 404 });
  }

  const cachedTranslation =
    locale !== "en" ? version.body_md_translations?.[locale] : null;
  if (locale !== "en" && !cachedTranslation) {
    return NextResponse.json(
      { error: `No translation cached for ${locale}` },
      { status: 404 },
    );
  }
  const body_md = cachedTranslation ?? version.body_md;

  const style = coerceStyle(contract.style);
  const business = await loadBusinessProfile(supabase, contract.business_profile_id);
  const logo =
    business?.logo_path && style.logo_placement !== "none"
      ? await fetchLogo(supabase, business.logo_path)
      : null;

  let pdf: Buffer;
  try {
    pdf = await renderContractPdf({
      body_md,
      title: contract.title ?? "Contract",
      style,
      logo_data_url: logo?.dataUrl,
      business: business ?? undefined,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to render PDF",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const localeSuffix = locale !== "en" ? `-${locale}` : "";
  const filename =
    sanitizeFilename(contract.title ?? "contract") + localeSuffix + ".pdf";
  const disposition = asDownload ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "contract";
}
