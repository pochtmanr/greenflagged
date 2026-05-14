"use client";

import * as React from "react";

type Props = { target: "free" | "payg" | "standard" };

export function BillingTierScroll({ target }: Props) {
  React.useEffect(() => {
    const el = document.querySelector<HTMLElement>(
      `[data-tier="${target}"]`,
    );
    if (!el) return;
    // Defer to next frame so layout is settled before scrolling.
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [target]);

  return null;
}
