import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContractEditor } from "@/components/contracts/contract-editor";
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
    // Scans aren't editable in this UI — bounce to the view page.
    redirect(`/contracts/${id}`);
  }

  const { data: latest } = await supabase
    .from("contract_versions")
    .select("id, version, body_md")
    .eq("contract_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: profilesRows } = await supabase
    .from("business_profiles")
    .select("id, business_name, first_name, family_name, label, is_default, logo_path")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const profiles = (profilesRows ?? []).map((p) => ({
    id: p.id,
    label:
      p.label ||
      p.business_name ||
      [p.first_name, p.family_name].filter(Boolean).join(" ") ||
      "Untitled profile",
    has_logo: Boolean(p.logo_path),
    is_default: Boolean(p.is_default),
  }));

  const initialStyle = coerceStyle(contract.style) ?? DEFAULT_STYLE;

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Link
            href={`/contracts/${id}`}
            className="gf-btn-link"
            style={{ alignSelf: "flex-start" }}
          >
            ← Back to contract
          </Link>

          <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
              // EDIT CONTRACT
            </span>
            <h1 className="gf-h2" style={{ marginTop: 0 }}>
              {contract.title ?? "Untitled contract"}
            </h1>
            <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
              Edit the body, pick a style, and choose which business profile signs it.
              Save creates a new version.
            </p>
          </header>

          <ContractEditor
            contractId={contract.id}
            initialTitle={contract.title ?? "Untitled contract"}
            initialBodyMd={latest?.body_md ?? ""}
            initialStyle={initialStyle}
            initialBusinessProfileId={contract.business_profile_id}
            profiles={profiles}
          />
        </div>
      </div>
    </section>
  );
}
