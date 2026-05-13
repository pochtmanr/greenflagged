import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { DeleteAccount } from "@/components/settings/delete-account";
import { SignOutButton } from "@/components/app/sign-out-button";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Green Flagged profile, billing, and session.",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 720 }}>
          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label">// SETTINGS</span>
            <h1 className="gf-h1">Your account</h1>
            <p className="gf-body" style={{ color: "var(--fg-2)" }}>
              Signed in as{" "}
              <span style={{ color: "var(--fg-1)" }}>{user.email}</span>.
            </p>
          </header>

          <ProfileForm
            initialAccountType={profile?.account_type ?? "solo"}
            initialCountry={profile?.country_code ?? "US"}
            initialBusinessName={profile?.business_name ?? ""}
            initialIndustries={profile?.industries ?? []}
          />

          <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 className="gf-h4">Billing</h3>
            <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
              Billing controls ship in Phase 4. For now you&apos;re on the free
              tier — 1 scan and 1 draft per month.
            </p>
          </div>

          <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 className="gf-h4">Session</h3>
            <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
              Sign out of this device. You can sign back in any time.
            </p>
            <div>
              <SignOutButton className="gf-btn gf-btn-ghost">
                Sign out
              </SignOutButton>
            </div>
          </div>

          <DeleteAccount />
        </div>
      </div>
    </section>
  );
}
