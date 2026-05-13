import { NextResponse } from "next/server";
import { checkAndReserveQuota } from "./quota";

/**
 * Shared quota gate for AI endpoints. Phases 2 (drafts) and 3 (scans) call
 * this at the top of their route handlers — if it returns a NextResponse,
 * short-circuit with that response; if it returns null, proceed.
 *
 * Contract:
 *   const blocked = await guardQuota(user.id, "scan");
 *   if (blocked) return blocked;
 *
 * 402 body: { error: "quota_exceeded", paywall_url: "/settings/billing" }
 */
export async function guardQuota(
  userId: string,
  kind: "scan" | "draft",
): Promise<NextResponse | null> {
  const result = await checkAndReserveQuota(userId, kind);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: "quota_exceeded",
        paywall_url: "/settings/billing",
      },
      { status: 402 },
    );
  }
  return null;
}
