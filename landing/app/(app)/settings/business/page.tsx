import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { SettingsNav } from "@/components/settings/settings-nav";
import { BusinessProfilesManager } from "@/components/settings/business-profiles-manager";

export const metadata: Metadata = {
  title: "Business profiles",
  description: "Manage the businesses that sign your contracts.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  label: string | null;
  first_name: string;
  family_name: string;
  business_name: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country_code: string;
  city: string;
  street: string;
  postal_code: string;
  is_default: boolean;
  logo_path: string | null;
};

export default async function BusinessSettingsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: profilesRows } = await sb
    .from("business_profiles")
    .select(
      "id,label,first_name,family_name,business_name,tax_id,email,phone,website,country_code,city,street,postal_code,is_default,logo_path",
    )
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const profiles: ProfileRow[] = (profilesRows ?? []) as ProfileRow[];

  const signed = await Promise.all(
    profiles.map(async (p) => {
      if (!p.logo_path) return { id: p.id, logo_url: null };
      const { data } = await supabase.storage
        .from("contracts")
        .createSignedUrl(p.logo_path, 60 * 30);
      return { id: p.id, logo_url: data?.signedUrl ?? null };
    }),
  );
  const logoUrlById = new Map(signed.map((s) => [s.id, s.logo_url]));

  const enriched = profiles.map((p) => ({
    ...p,
    logo_url: logoUrlById.get(p.id) ?? null,
  }));

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <SettingsNav current="business" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            marginTop: 32,
          }}
        >
          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label">// BUSINESS PROFILES</span>
            <h1 className="gf-h1">Your businesses</h1>
            <p className="gf-body" style={{ color: "var(--fg-2)" }}>
              These are the businesses you sign contracts as. The default
              profile pre-fills your provider details in new contracts.
            </p>
          </header>

          <BusinessProfilesManager profiles={enriched} />
        </div>
      </div>
    </section>
  );
}
