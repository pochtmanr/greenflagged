import type { PlanId } from "@/lib/supabase/types";

export type PlanInterval = "month" | "once";

export type Plan = {
  id: PlanId;
  label: string;
  family: "free" | "standard";
  contracts: number;
  seats: number;
  price_cents: number;
  overage_price_cents: number | null;
  currency: "USD";
  interval: PlanInterval;
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    family: "free",
    contracts: 1,
    seats: 1,
    price_cents: 0,
    overage_price_cents: null,
    currency: "USD",
    interval: "month",
  },
  standard: {
    id: "standard",
    label: "Standard",
    family: "standard",
    contracts: 10,
    seats: 1,
    price_cents: 2500,
    overage_price_cents: 300,
    currency: "USD",
    interval: "month",
  },
};

// Pay-as-you-go: $3 buys 1 contract credit valid for 90 days.
// Bought via card (Revolut) or crypto (OxaPay). Not a subscription.
export const PAYG = {
  price_cents: 300,
  currency: "USD" as const,
  contracts: 1,
  ttl_days: 90,
  source: "payg_3usd" as const,
  label: "Pay-as-you-go ($3)",
};

export function isUnlimited(n: number): boolean {
  return !Number.isFinite(n);
}

export function isPaidPlan(planId: PlanId): boolean {
  return planId !== "free";
}

export function periodLengthDays(interval: PlanInterval): number {
  return interval === "month" ? 30 : 0;
}
