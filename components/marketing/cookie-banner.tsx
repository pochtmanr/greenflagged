"use client";

import * as React from "react";
import Link from "next/link";

const STORAGE_KEY = "gf:cookie-consent:v1";

type Consent = "accepted" | "essential";

export function CookieBanner() {
  const [visible, setVisible] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const persist = (value: Consent) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* private mode — just don't persist */
    }
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="cookie-banner"
    >
      <div className="cookie-banner__inner">
        <span aria-hidden className="cookie-banner__stripe" />
        <div style={{ flex: 1 }}>
          <div className="cookie-banner__title">
            <span aria-hidden className="cookie-banner__title-dot" />
            <span
              className="gf-label"
              style={{ color: "var(--sev-yellow)" }}
            >
              Cookies
            </span>
          </div>
          <p className="cookie-banner__copy">
            We use essential cookies to keep the site running and optional
            analytics to learn what works. Your contracts are never tracked or
            shared.{" "}
            <Link href="/cookies" style={{ color: "var(--fg-1)" }}>
              Read the cookie policy
            </Link>
            .
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button
            type="button"
            className="gf-btn-link"
            onClick={() => persist("essential")}
          >
            Essential only
          </button>
          <button
            type="button"
            className="gf-btn"
            onClick={() => persist("accepted")}
          >
            Accept all <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
