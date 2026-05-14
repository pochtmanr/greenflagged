import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContractEditor } from "@/components/contracts/contract-editor";
import { loadBusinessProfile } from "@/lib/contracts/business";
import { coerceStyle, DEFAULT_STYLE } from "@/lib/pdf/themes";
import { getSupabaseServer } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Edit · ${id.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
}

export default async function ContractEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select(
      "id, owner_id, kind, industry, title, style, business_profile_id, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (cErr || !contract) notFound();
  if (contract.owner_id !== user.id) notFound();
  if (contract.kind !== "drafted") {
    redirect(`/contracts/${id}`);
  }

  // body_md_translations added in migration 0008. Supabase types aren't
  // regenerated yet, so cast through `any` like the rest of the codebase does
  // for post-migration columns.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: latest } = (await sb
    .from("contract_versions")
    .select("id, version, body_md, body_md_translations")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle()) as {
    data: {
      id: string;
      version: number;
      body_md: string | null;
      body_md_translations: Record<string, string> | null;
    } | null;
  };

  const { data: profilesRows } = await supabase
    .from("business_profiles")
    .select("id, business_name, first_name, family_name, label, is_default, logo_path")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const profiles = (profilesRows ?? []).map((p) => {
    const personal = [p.first_name, p.family_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const label =
      p.label ||
      p.business_name ||
      (personal.length > 0 ? personal : "Untitled profile");
    return {
      id: p.id,
      label,
      has_logo: Boolean(p.logo_path),
      is_default: Boolean(p.is_default),
    };
  });

  const initialStyle = coerceStyle(contract.style) ?? DEFAULT_STYLE;
  const cachedTranslations = latest?.body_md_translations ?? null;

  // Resolve the current business profile for live editor preview (logo +
  // company name + address) so the editor surface mirrors what the PDF /
  // /preview page will produce.
  const business = await loadBusinessProfile(
    supabase,
    contract.business_profile_id,
  );
  const businessName =
    business?.business_name ||
    [business?.first_name, business?.family_name].filter(Boolean).join(" ") ||
    null;
  const businessAddress = business?.address_line ?? null;
  let logoSignedUrl: string | null = null;
  if (business?.logo_path && initialStyle.logo_placement !== "none") {
    const { data: signed } = await supabase.storage
      .from("contracts")
      .createSignedUrl(business.logo_path, 60 * 30);
    logoSignedUrl = signed?.signedUrl ?? null;
  }

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Link
            href={`/contracts/${id}`}
            className="gf-btn-link"
            style={{ alignSelf: "flex-start" }}
          >
            ← Back to contract
          </Link>

          <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              className="gf-label"
              style={{ color: "var(--accent-strong)" }}
            >
              {"// EDIT CONTRACT"}
            </span>
            <p
              className="gf-mono-sm"
              style={{ color: "var(--fg-3)", margin: 0 }}
            >
              Saving creates a new version.
            </p>
          </header>

          <ContractEditor
            contractId={contract.id}
            initialTitle={contract.title ?? "Untitled contract"}
            initialBodyMd={latest?.body_md ?? ""}
            initialStyle={initialStyle}
            initialBusinessProfileId={contract.business_profile_id}
            initialTranslations={cachedTranslations}
            profiles={profiles}
            initialLogoSrc={logoSignedUrl}
            initialBusinessName={businessName}
            initialBusinessAddress={businessAddress}
          />
        </div>
      </div>
    </section>
  );
}
