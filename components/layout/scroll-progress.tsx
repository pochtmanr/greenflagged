"use client";

import * as React from "react";

export function ScrollProgress() {
  React.useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const progress = max > 0 ? h.scrollTop / max : 0;
      document.documentElement.style.setProperty("--scroll", progress.toFixed(4));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="scroll-progress" aria-hidden />;
}
