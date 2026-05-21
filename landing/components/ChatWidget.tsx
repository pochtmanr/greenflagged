"use client";

import { useEffect, useRef, useState } from "react";

const COLLAPSED = { width: 80, height: 80 };
const EXPANDED = { width: 380, height: 600 };

export function ChatWidget() {
  const url = process.env.NEXT_PUBLIC_CHATKIT_URL;
  const key = process.env.NEXT_PUBLIC_CHATKIT_KEY;
  const [open, setOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!url) return;
    const expected = new URL(url).origin;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== expected) return;
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type !== "chat-admin:widget") return;
      setOpen(Boolean(data.open));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [url]);

  if (!url || !key) return null;

  const src = `${url.replace(/\/$/, "")}/embed/widget?key=${encodeURIComponent(key)}`;
  const size = open ? EXPANDED : COLLAPSED;

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="Support chat"
      allow="clipboard-write"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: size.width,
        height: size.height,
        border: 0,
        zIndex: 9999,
        background: "transparent",
        colorScheme: "light",
        transition: "width 200ms ease, height 200ms ease",
      }}
    />
  );
}
