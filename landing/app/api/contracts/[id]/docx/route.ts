import { NextResponse } from "next/server";
import { loadBusinessProfile } from "@/lib/contracts/business";
import { isSupportedLocale } from "@/lib/contracts/i18n";
import { renderContractDocx } from "@/lib/docx/render";
import { fetchLogo } from "@/lib/pdf/logo";
import { coerceStyle } from "@/lib/pdf/themes";
import { getSupabaseFromRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale");
  const locale = isSupportedLocale(localeParam) ? localeParam : "en";

  const supabase = await getSupabaseFromRequest();
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: version, error: vErr } = (await sb
    .from("contract_versions")
    .select("body_md, body_md_translations")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()) as {
    data: {
      body_md: string | null;
      body_md_translations: Record<string, string> | null;
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

  let docx: Buffer;
  try {
    docx = await renderContractDocx({
      body_md,
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

  const localeSuffix = locale !== "en" ? `-${locale}` : "";
  const filename =
    sanitizeFilename(contract.title ?? "contract") + localeSuffix + ".docx";
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
