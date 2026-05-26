"use client";

import { useEffect, useRef } from "react";

const COLLAPSED = { width: 80, height: 80 };
const EXPANDED = { width: 380, height: 600 };

/**
 * Holylabs chat — Round 5 (authenticated) embed.
 *
 * Fetches a short-lived JWT from our own /api/holylabs-token, then mounts
 * the iframe with `?key=...&token=...`. Anonymous visitors get a 401 from
 * the mint route and the iframe stays unmounted (clean — no broken
 * launcher on marketing pages).
 */
export function ChatWidget() {
  const url = process.env.NEXT_PUBLIC_HOLYLABS_URL;
  const pk = process.env.NEXT_PUBLIC_HOLYLABS_PK_LIVE;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const nonceRef = useRef<string>("");

  useEffect(() => {
    if (!url || !pk) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    const widgetOrigin = new URL(url).origin;
    nonceRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const nonce = nonceRef.current;
    const hostOrigin = window.location.origin;

    let cancelled = false;
    let readyAcked = false;
    let initRetry: ReturnType<typeof setInterval> | null = null;
    let initGiveUp: ReturnType<typeof setTimeout> | null = null;

    const sendInit = () => {
      const w = iframeRef.current?.contentWindow;
      if (!w) return;
      if (process.env.NODE_ENV !== "production") {
        console.debug("[holylabs] sendInit", { nonce, hostOrigin, widgetOrigin });
      }
      w.postMessage(
        { v: 1, type: "init", nonce, hostOrigin },
        widgetOrigin,
      );
    };

    const stopRetry = () => {
      if (initRetry) {
        clearInterval(initRetry);
        initRetry = null;
      }
      if (initGiveUp) {
        clearTimeout(initGiveUp);
        initGiveUp = null;
      }
    };

    (async () => {
      try {
        const res = await fetch("/api/holylabs-token", { method: "POST" });
        if (!res.ok) return;
        const { token } = (await res.json()) as { token: string };
        if (cancelled || !iframeRef.current) return;
        iframeRef.current.src =
          `${widgetOrigin}/embed/customer` +
          `?key=${encodeURIComponent(pk)}` +
          `&token=${encodeURIComponent(token)}`;
      } catch {
        // anonymous visitor or network blip — iframe stays blank
      }
    })();

    // The iframe's React effect that registers its message listener may
    // not be live yet when `load` fires (HTML parsed but hydration
    // pending), so the first `init` can land before anyone's listening.
    // Retry every 150ms until the iframe replies with `ready`, capped
    // at 3s so we don't loop forever on a hard auth failure.
    const onLoad = () => {
      sendInit();
      initRetry = setInterval(() => {
        if (readyAcked) {
          stopRetry();
          return;
        }
        sendInit();
      }, 150);
      initGiveUp = setTimeout(stopRetry, 3000);
    };
    iframe.addEventListener("load", onLoad);

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== widgetOrigin) return;
      const data = e.data as
        | { v?: number; type?: string; nonce?: string; open?: boolean }
        | null;
      if (!data || data.v !== 1 || data.nonce !== nonce) return;
      if (data.type === "ready") {
        readyAcked = true;
        stopRetry();
        return;
      }
      if (data.type === "open" && iframeRef.current) {
        const size = data.open ? EXPANDED : COLLAPSED;
        iframeRef.current.style.width = `${size.width}px`;
        iframeRef.current.style.height = `${size.height}px`;
      }
    };
    window.addEventListener("message", onMessage);

    window.holylabsSignOut = () => {
      iframeRef.current?.contentWindow?.postMessage(
        { v: 1, type: "sign-out", nonce },
        widgetOrigin,
      );
    };

    return () => {
      cancelled = true;
      stopRetry();
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", onMessage);
      delete window.holylabsSignOut;
    };
  }, [url, pk]);

  if (!url || !pk) return null;

  // The Next.js dev indicator pins itself at right:16, bottom:16 and
  // its stacking context sits above our iframe regardless of z-index.
  // In dev we shift up so the launcher is visible and clickable;
  // in production the Next.js badge is gone so we sit at 16/16.
  const bottomOffset = process.env.NODE_ENV === "production" ? 16 : 72;

  return (
    <iframe
      ref={iframeRef}
      title="Support chat"
      allow="clipboard-write"
      referrerPolicy="origin"
      style={{
        position: "fixed",
        right: 16,
        bottom: bottomOffset,
        width: COLLAPSED.width,
        height: COLLAPSED.height,
        border: 0,
        zIndex: 9999,
        background: "transparent",
        colorScheme: "light",
        transition: "width 200ms ease, height 200ms ease",
      }}
    />
  );
}

declare global {
  interface Window {
    holylabsSignOut?: () => void;
  }
}
