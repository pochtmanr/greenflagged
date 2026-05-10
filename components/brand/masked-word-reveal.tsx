"use client";

import * as React from "react";
import { gsap, revealMaskedText } from "@/lib/gsap";
import { cn } from "@/lib/cn";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type MaskedWordRevealProps = {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  stagger?: number;
};

type Word = { text: string; className?: string };

function extractWords(node: React.ReactNode, inherit?: string): Word[] {
  const out: Word[] = [];
  React.Children.forEach(node, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      String(child)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((text) => out.push({ text, className: inherit }));
    } else if (React.isValidElement(child)) {
      const props = child.props as {
        className?: string;
        children?: React.ReactNode;
      };
      out.push(...extractWords(props.children, cn(inherit, props.className)));
    }
  });
  return out;
}

export function MaskedWordReveal({
  children,
  className,
  as: Tag = "h1",
  delay = 0.1,
  stagger = 0.06,
}: MaskedWordRevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  useIsoLayoutEffect(() => {
    if (!ref.current) return;
    const targets = ref.current.querySelectorAll<HTMLElement>(".gs-reveal-text");
    if (!targets.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(targets, { yPercent: 110 });
    revealMaskedText(ref.current, { delay, stagger });
  }, [delay, stagger]);

  const words = extractWords(children);

  return (
    <Tag
      ref={(el) => {
        ref.current = el;
      }}
      className={cn("flex flex-wrap gap-x-[0.25em] leading-[0.95]", className)}
    >
      {words.map(({ text, className: wc }, i) => (
        <span key={`${text}-${i}`} className="gs-reveal-wrapper">
          <span className={cn("gs-reveal-text", wc)}>{text}</span>
        </span>
      ))}
    </Tag>
  );
}
