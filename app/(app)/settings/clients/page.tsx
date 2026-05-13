import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { SettingsNav } from "@/components/settings/settings-nav";
import { ClientsManager } from "@/components/settings/clients-manager";

export const metadata: Metadata = {
  title: "Clients",
  description: "Manage the clients you contract with.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  first_name: string;
  family_name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string;
  city: string;
  street: string;
  postal_code: string;
  notes: string | null;
  is_default: boolean;
};

export default async function ClientsSettingsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { data: clientRows } = await sb
    .from("clients")
    .select(
      "id,first_name,family_name,business_name,email,phone,country_code,city,street,postal_code,notes,is_default",
    )
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const clients: ClientRow[] = (clientRows ?? []) as ClientRow[];

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <SettingsNav current="clients" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            maxWidth: 880,
            marginTop: 32,
          }}
        >
          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label">// CLIENTS</span>
            <h1 className="gf-h1">Your clients</h1>
            <p className="gf-body" style={{ color: "var(--fg-2)" }}>
              Saved clients pre-fill into new contracts. The default client
              gets selected automatically in the wizard.
            </p>
          </header>

          <ClientsManager clients={clients} />
        </div>
      </div>
    </section>
  );
}
