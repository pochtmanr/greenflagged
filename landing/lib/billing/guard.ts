import { NextResponse } from "next/server";
import { checkAndReserveQuota, type ReserveResult } from "./quota";

export type GuardOutcome =
  | { blocked: NextResponse; reserved: null }
  | { blocked: null; reserved: ReserveResult };

/**
 * Returns a 402 response if the user can't perform the action; otherwise
 * returns the reserve result (so the caller knows whether to fire a
 * post-action overage MIT charge — see prompt12).
 *
 * Usage:
 *   const { blocked, reserved } = await guardQuota(user.id, "scan");
 *   if (blocked) return blocked;
 *   // ... do AI work ...
 *   if (reserved!.overage) chargeOverage(user.id, contract_id).catch(...);
 */
export async function guardQuota(
  userId: string,
  kind: "scan" | "draft",
): Promise<GuardOutcome> {
  const result = await checkAndReserveQuota(userId, kind);
  if (!result.ok) {
    return {
      blocked: NextResponse.json(
        { error: "quota_exceeded", paywall_url: "/settings/billing" },
        { status: 402 },
      ),
      reserved: null,
    };
  }
  return { blocked: null, reserved: result };
}
