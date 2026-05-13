import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/supabase/types";
import { PLANS } from "@/lib/billing/plans";
import { ProfileForm } from "@/components/settings/profile-form";
import { DeleteAccount } from "@/components/settings/delete-account";
import { SettingsNav } from "@/components/settings/settings-nav";
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

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const planId = (sub?.plan as PlanId | null) ?? "free";
  const planLabel = PLANS[planId]?.label ?? "Free";
  const status = sub?.status ?? "active";

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <SettingsNav current="profile" />
        <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 720, marginTop: 32 }}>
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h3 className="gf-h4" style={{ margin: 0 }}>
                Billing
              </h3>
              <span
                className={`gf-tag sev-${
                  status === "past_due"
                    ? "orange"
                    : status === "canceled" || status === "expired"
                      ? "yellow"
                      : "green"
                }`}
              >
                {planLabel.toUpperCase()}
              </span>
            </div>
            <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
              {planId === "free"
                ? "You're on the free tier — 1 scan per month, drafts are unlimited."
                : `You're on the ${planLabel} plan.`}
            </p>
            <div>
              <Link href="/settings/billing" className="gf-btn gf-btn-ghost">
                Manage billing <span className="arrow">→</span>
              </Link>
            </div>
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
