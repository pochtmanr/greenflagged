import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata: Metadata = {
  title: "Welcome — set up your account",
  description: "Tell us a bit about how you work so we can tune Green Flagged for you.",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("user_id", user.id)
    .single();
  if (profile?.onboarded_at) redirect("/dashboard");

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 32,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label">// WELCOME</span>
            <h1 className="gf-h1">A couple of details and you&apos;re in.</h1>
            <p className="gf-body" style={{ color: "var(--fg-2)" }}>
              We tune the redlines, severity thresholds, and jurisdiction hints
              from these answers. You can change them later in settings.
            </p>
          </div>
          <OnboardingWizard />
        </div>
      </div>
    </section>
  );
}
