"use client";

import * as React from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      // ignore — banner just won't be sticky in private mode
    }
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[1100px] md:inset-x-6 md:bottom-6"
    >
      <div className="relative flex flex-col gap-4 border border-border-glass bg-[var(--bg)] p-5 md:flex-row md:items-center md:gap-6 md:p-6">
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-1 bg-yellow-400"
        />

        <div className="flex-1 pl-2">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-yellow-300"
            />
            <span className="text-label text-yellow-300">Cookies</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            We use a couple of essential cookies to keep the site running and
            optional analytics to learn what works. Your contracts are never
            tracked or shared.{" "}
            <Link
              href="/cookies"
              className="text-text-primary hover:text-blue-300"
            >
              Read the cookie policy
            </Link>
            .
          </p>
        </div>

        <div className="flex items-center gap-6 md:shrink-0">
          <Button
            type="button"
            variant="muted"
            size="sm"
            onClick={() => persist("essential")}
          >
            Essential only
          </Button>
          <Button
            type="button"
            variant="light"
            size="md"
            onClick={() => persist("accepted")}
          >
            Accept all
            <span aria-hidden className="btn-arrow transition-transform">
              →
            </span>
          </Button>
        </div>

        <button
          type="button"
          aria-label="Dismiss cookie banner"
          onClick={() => persist("essential")}
          className="absolute right-3 top-3 inline-flex size-7 items-center justify-center text-text-secondary transition-colors hover:text-text-primary md:hidden"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
