import type { PlanId } from "@/lib/supabase/types";

export type PlanInterval = "month" | "year" | "once";

export type Plan = {
  id: PlanId;
  label: string;
  family: "free" | "freelancer" | "pro";
  scans: number;
  drafts: number;
  seats: number;
  price_cents: number;
  currency: "EUR";
  interval: PlanInterval;
};

// `scans`/`drafts` use Number.POSITIVE_INFINITY for unlimited tiers.
// `Math.max` and arithmetic both behave correctly with Infinity.
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    family: "free",
    scans: 1,
    drafts: Number.POSITIVE_INFINITY,
    seats: 1,
    price_cents: 0,
    currency: "EUR",
    interval: "month",
  },
  freelancer_monthly: {
    id: "freelancer_monthly",
    label: "Freelancer",
    family: "freelancer",
    scans: 25,
    drafts: 25,
    seats: 1,
    price_cents: 1500,
    currency: "EUR",
    interval: "month",
  },
  freelancer_yearly: {
    id: "freelancer_yearly",
    label: "Freelancer",
    family: "freelancer",
    scans: 25,
    drafts: 25,
    seats: 1,
    price_cents: 15000,
    currency: "EUR",
    interval: "year",
  },
  pro_monthly: {
    id: "pro_monthly",
    label: "Pro",
    family: "pro",
    scans: Number.POSITIVE_INFINITY,
    drafts: Number.POSITIVE_INFINITY,
    seats: 3,
    price_cents: 3900,
    currency: "EUR",
    interval: "month",
  },
  pro_yearly: {
    id: "pro_yearly",
    label: "Pro",
    family: "pro",
    scans: Number.POSITIVE_INFINITY,
    drafts: Number.POSITIVE_INFINITY,
    seats: 3,
    price_cents: 39000,
    currency: "EUR",
    interval: "year",
  },
};

// €9 one-off pack: +1 scan + 1 draft, valid 7 days.
export const ONE_OFF = {
  price_cents: 900,
  currency: "EUR" as const,
  scans: 1,
  drafts: 1,
  ttl_days: 7,
  source: "one_off_9eur" as const,
  label: "Single scan + draft (€9)",
};

export function isUnlimited(n: number): boolean {
  return !Number.isFinite(n);
}

export function isPaidPlan(planId: PlanId): boolean {
  return planId !== "free";
}

export function periodLengthDays(interval: PlanInterval): number {
  switch (interval) {
    case "year":
      return 365;
    case "month":
      return 30;
    case "once":
      return 0;
  }
}
