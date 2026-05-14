import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase/server";
import type { PlanId } from "@/lib/supabase/types";
import { PLANS, isUnlimited } from "./plans";

export type Quota = {
  plan: PlanId;
  plan_label: string;
  status: string;
  current_period_end: string | null;
  contracts: { used: number; limit: number; remaining: number; unlimited: boolean };
  credits: { contracts: number; earliest_expires_at: string | null };
  // True only when on Standard and over the included cap — caller should
  // proceed and trigger a Revolut MIT overage charge.
  overage: boolean;
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

  const [{ data: sub }, { data: credits }, usageCount] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("credits")
      .select("contracts_remaining, expires_at")
      .eq("user_id", userId)
      .gt("expires_at", nowIso)
      .gt("contracts_remaining", 0),
    supabase
      .from("usage_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("kind", ["scan", "draft"])
      .gte("created_at", monthStart),
  ]);

  const isPaidStatus = sub?.status === "active" || sub?.status === "trialing";
  const planId: PlanId = isPaidStatus && sub ? (sub.plan as PlanId) : "free";
  const plan = PLANS[planId];

  const used = usageCount.count ?? 0;
  const limit = plan.contracts;
  const remaining = Math.max(0, limit - used);

  const creditTotal =
    (credits ?? []).reduce((s, c) => s + (c.contracts_remaining ?? 0), 0);
  const earliest = (credits ?? [])
    .map((c) => c.expires_at)
    .sort()[0] ?? null;

  // overage = Standard, over included cap, no credits to cover it
  const overage = planId === "standard" && remaining <= 0 && creditTotal <= 0;

  return {
    plan: planId,
    plan_label: plan.label,
    status: sub?.status ?? "active",
    current_period_end: sub?.current_period_end ?? null,
    contracts: { used, limit, remaining, unlimited: isUnlimited(limit) },
    credits: { contracts: creditTotal, earliest_expires_at: earliest },
    overage,
  };
}

export type ReserveResult =
  | { ok: true; usedCredit: boolean; overage: boolean }
  | { ok: false; reason: "no_quota_no_credits" };

/**
 * Decide whether the user is allowed to perform a scan/draft action.
 *
 * - Free over cap and no credits → blocked.
 * - PAYG (no active sub) consumes a credit; blocked if none available.
 * - Standard within cap → allowed; over cap → allowed with `overage=true`
 *   so the caller can fire a Revolut MIT $3 charge post-action.
 *
 * Quota is read on every call (no reservation); usage_events insert from
 * the route handler is the only mutation.
 */
export async function checkAndReserveQuota(
  userId: string,
  // Kept on the signature so callers can pass the action kind even though
  // quota is unified — leaves room for per-kind logic later without
  // rewiring every call site.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _kind: "scan" | "draft",
): Promise<ReserveResult> {
  const q = await getQuota(userId);

  if (q.plan === "standard") {
    return { ok: true, usedCredit: false, overage: q.overage };
  }

  // Free + PAYG share the free subscription row. Plan cap first, then credits.
  if (q.contracts.remaining > 0) {
    return { ok: true, usedCredit: false, overage: false };
  }

  if (q.credits.contracts > 0) {
    // Consume one credit (oldest-expiring row, contracts_remaining > 0).
    const svc = getSupabaseServiceRole();
    const { data: row } = await svc
      .from("credits")
      .select("id, contracts_remaining")
      .eq("user_id", userId)
      .gt("contracts_remaining", 0)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (row) {
      await svc
        .from("credits")
        .update({ contracts_remaining: row.contracts_remaining - 1 })
        .eq("id", row.id);
      return { ok: true, usedCredit: true, overage: false };
    }
  }

  return { ok: false, reason: "no_quota_no_credits" };
}
