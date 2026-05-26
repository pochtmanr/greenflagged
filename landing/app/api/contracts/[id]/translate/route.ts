import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SUPPORTED_LOCALES,
  isSupportedLocale,
  translateTemplate,
  type Locale,
} from "@/lib/contracts/i18n";
import { getSupabaseFromRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  locale: z.enum(SUPPORTED_LOCALES),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { locale: Locale };
  try {
    body = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      {
        error: "Invalid body",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!contract || contract.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // body_md_translations added in migration 0008 — cast through any until
  // supabase types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: latest } = (await sb
    .from("contract_versions")
    .select("id, body_md, body_md_translations")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()) as {
    data: {
      id: string;
      body_md: string | null;
      body_md_translations: Record<string, string> | null;
    } | null;
  };
  if (!latest?.body_md) {
    return NextResponse.json({ error: "No contract body" }, { status: 404 });
  }

  if (body.locale === "en") {
    return NextResponse.json({ body_md: latest.body_md, cached: true });
  }

  const cache = (latest.body_md_translations ?? {}) as Record<string, string>;
  if (cache[body.locale] && !isSupportedLocale(body.locale)) {
    return NextResponse.json({ body_md: cache[body.locale], cached: true });
  }
  if (cache[body.locale]) {
    return NextResponse.json({ body_md: cache[body.locale], cached: true });
  }

  let translated: string;
  try {
    translated = await translateTemplate(latest.body_md, body.locale);
  } catch (err) {
    return NextResponse.json(
      {
        error: "translate_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const nextCache = { ...cache, [body.locale]: translated };
  await sb
    .from("contract_versions")
    .update({ body_md_translations: nextCache })
    .eq("id", latest.id);

  return NextResponse.json({ body_md: translated, cached: false });
}
