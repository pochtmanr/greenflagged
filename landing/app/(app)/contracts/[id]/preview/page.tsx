import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PreviewClient } from "@/components/contracts/preview-client";
import { coerceStyle, DEFAULT_STYLE } from "@/lib/pdf/themes";
import { getSupabaseServer } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Preview · ${id.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
}

export default async function ContractPreviewPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, owner_id, kind, title, style, business_profile_id")
    .eq("id", id)
    .maybeSingle();
  if (!contract || contract.owner_id !== user.id) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: latest } = (await sb
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
  };
  if (!latest?.body_md) notFound();

  let businessName: string | null = null;
  let businessAddress: string | null = null;
  let logoSignedUrl: string | null = null;
  if (contract.business_profile_id) {
    const { data: profile } = await supabase
      .from("business_profiles")
      .select(
        "business_name, first_name, family_name, logo_path, street, city, postal_code, country_code",
      )
      .eq("id", contract.business_profile_id)
      .maybeSingle();
    if (profile) {
      const personal = [profile.first_name, profile.family_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      businessName = profile.business_name || personal || null;
      const addrParts = [
        profile.street,
        profile.city,
        profile.postal_code,
        profile.country_code,
      ].filter((s): s is string => typeof s === "string" && s.trim().length > 0);
      businessAddress = addrParts.length > 0 ? addrParts.join(", ") : null;
      if (profile.logo_path) {
        const { data } = await supabase.storage
          .from("contracts")
          .createSignedUrl(profile.logo_path, 60 * 30);
        logoSignedUrl = data?.signedUrl ?? null;
      }
    }
  }

  const style = coerceStyle(contract.style) ?? DEFAULT_STYLE;
  const translations =
    (latest.body_md_translations as Record<string, string> | null) ?? {};

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="app-shell">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Link
              href={`/contracts/${id}/edit`}
              className="gf-btn-link"
            >
              ← Back to edit
            </Link>
            <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
              // PREVIEW
            </span>
          </div>

          <PreviewClient
            contractId={id}
            title={contract.title ?? "Untitled contract"}
            bodyMd={latest.body_md}
            translations={translations}
            style={style}
            businessName={businessName}
            businessAddress={businessAddress}
            logoSrc={logoSignedUrl}
          />
        </div>
      </div>
    </section>
  );
}
