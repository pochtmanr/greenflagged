"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

const VALID = new Set(["free", "payg", "standard"]);

/**
 * Reads sessionStorage `gf_pending_upgrade` set by the sign-up form
 * (when arriving via /sign-up?intent=upgrade&plan=X). If present, clears
 * it and routes to /settings/billing?plan=X so the upgrade flow continues
 * after onboarding instead of dropping the user on /dashboard.
 */
export function PendingUpgradeRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let plan: string | null = null;
    try {
      plan = window.sessionStorage.getItem("gf_pending_upgrade");
    } catch {
      return;
    }
    if (!plan || !VALID.has(plan)) return;
    try {
      window.sessionStorage.removeItem("gf_pending_upgrade");
    } catch {
      // ignore — non-fatal
    }
    router.replace(`/settings/billing?plan=${plan}`);
  }, [router]);

  return null;
}
