import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UsageMeter } from "@/components/dashboard/usage-meter";
import { ContractsList } from "@/components/dashboard/contracts-list";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PLANS } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Green Flagged contracts, scans, and usage.",
  robots: { index: false, follow: false },
};

function firstNameFromEmail(email: string | null | undefined): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "there";
  return local
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  const [
    profileRes,
    contractsRes,
    contractsCountRes,
    eventsRes,
    subRes,
  ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase
        .from("contracts")
        .select("id,title,kind,verdict_severity,created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("kind", ["scan", "draft"])
        .gte("created_at", monthStartIso),
      supabase
        .from("usage_events")
        .select("id,kind,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const profile = profileRes.data;
  const contracts = contractsRes.data ?? [];
  const contractCount = contractsCountRes.count ?? 0;
  const events = eventsRes.data ?? [];

  const sub = subRes.data;
  const isPaidStatus = sub?.status === "active" || sub?.status === "trialing";
  const planId: PlanId =
    (isPaidStatus ? (sub?.plan as PlanId) : "free") ?? "free";
  const plan = PLANS[planId];

  const greetingName =
    profile?.business_name ?? firstNameFromEmail(user.email ?? null);

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label">// WELCOME, {greetingName.toUpperCase()}</span>
            <h1 className="gf-h1">Your dashboard</h1>
          </header>

          <QuickActions />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
            }}
            className="dashboard__grid"
          >
            <UsageMeter
              contracts={contractCount}
              contractLimit={plan.contracts}
              planLabel={`${plan.label} tier`}
            />
            <ActivityFeed events={events} />
          </div>

          <ContractsList contracts={contracts} />
        </div>
      </div>
    </section>
  );
}
