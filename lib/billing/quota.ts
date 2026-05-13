import { getSupabaseServer } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/supabase/types";
import { PLANS, isUnlimited } from "./plans";

export type Quota = {
  plan: PlanId;
  plan_label: string;
  status: string;
  current_period_end: string | null;
  scans: { used: number; limit: number; remaining: number; unlimited: boolean };
  drafts: { used: number; limit: number; remaining: number; unlimited: boolean };
  credits: {
    scans: number;
    drafts: number;
    earliest_expires_at: string | null;
  };
};

function startOfMonthIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getQuota(userId: string): Promise<Quota> {
  const supabase = await getSupabaseServer();
  const monthStart = startOfMonthIso();
  const nowIso = new Date().toISOString();

  const [{ data: sub }, { data: credits }, scanCount, draftCount] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "plan, status, current_period_end, cancel_at_period_end",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("credits")
        .select("scans_remaining, drafts_remaining, expires_at")
        .eq("user_id", userId)
        .gt("expires_at", nowIso),
      supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("kind", "scan")
        .gte("created_at", monthStart),
      supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("kind", "draft")
        .gte("created_at", monthStart),
    ]);

  // Paid plan only applies while subscription is active/trialing.
  const isPaidStatus = sub?.status === "active" || sub?.status === "trialing";
  const planId: PlanId = (isPaidStatus ? (sub?.plan as PlanId) : "free") ?? "free";
  const plan = PLANS[planId];

  const scanUsed = scanCount.count ?? 0;
  const draftUsed = draftCount.count ?? 0;

  const creditScans = (credits ?? []).reduce(
    (acc, c) => acc + (c.scans_remaining ?? 0),
    0,
  );
  const creditDrafts = (credits ?? []).reduce(
    (acc, c) => acc + (c.drafts_remaining ?? 0),
    0,
  );
  const earliestExpiry =
    (credits ?? [])
      .filter((c) => (c.scans_remaining ?? 0) + (c.drafts_remaining ?? 0) > 0)
      .map((c) => c.expires_at)
      .sort()[0] ?? null;

  const scanUnlimited = isUnlimited(plan.scans);
  const draftUnlimited = isUnlimited(plan.drafts);

  return {
    plan: planId,
    plan_label: plan.label,
    status: sub?.status ?? "active",
    current_period_end: sub?.current_period_end ?? null,
    scans: {
      used: scanUsed,
      limit: plan.scans,
      remaining: scanUnlimited
        ? Number.POSITIVE_INFINITY
        : Math.max(0, plan.scans - scanUsed) + creditScans,
      unlimited: scanUnlimited,
    },
    drafts: {
      used: draftUsed,
      limit: plan.drafts,
      remaining: draftUnlimited
        ? Number.POSITIVE_INFINITY
        : Math.max(0, plan.drafts - draftUsed) + creditDrafts,
      unlimited: draftUnlimited,
    },
    credits: {
      scans: creditScans,
      drafts: creditDrafts,
      earliest_expires_at: earliestExpiry,
    },
  };
}

export type QuotaCheckResult =
  | { ok: true }
  | { ok: false; reason: "quota_exceeded" };

export async function checkAndReserveQuota(
  userId: string,
  kind: "scan" | "draft",
): Promise<QuotaCheckResult> {
  const q = await getQuota(userId);
  const remaining = kind === "scan" ? q.scans.remaining : q.drafts.remaining;
  if (remaining <= 0) return { ok: false, reason: "quota_exceeded" };
  return { ok: true };
}
