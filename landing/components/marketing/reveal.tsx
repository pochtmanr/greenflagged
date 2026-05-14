"use client";

import * as React from "react";

type RevealProps = {
  children: React.ReactNode;
  /** Delay before this element starts revealing, in ms. Used for stagger. */
  delayMs?: number;
  /** Optional class names to merge on the wrapping element. */
  className?: string;
  /** Element tag — defaults to `div`. Use "li" / "section" / etc when semantic. */
  as?: keyof React.JSX.IntrinsicElements;
  /** When passed, exposed as a CSS custom property for in-CSS index math. */
  cssIndex?: number;
  /** Inline styles merged onto the wrapper. */
  style?: React.CSSProperties;
};

/**
 * Wrap any block to fade-up on first scroll into view. CSS handles the transition
 * via `[data-reveal][data-revealed="true"]`. Respects `prefers-reduced-motion`.
 */
export function Reveal({
  children,
  delayMs,
  className,
  as = "div",
  cssIndex,
  style,
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  // Lazy initial state: if reduced-motion is on, start already-revealed so the
  // observer never has to fire and we skip the cascading render.
  const [revealed, setRevealed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    );
  });

  React.useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [revealed]);

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(delayMs ? { transitionDelay: `${delayMs}ms` } : null),
    ...(cssIndex !== undefined
      ? ({ "--reveal-i": cssIndex } as React.CSSProperties)
      : null),
  };

  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      data-reveal=""
      data-revealed={revealed ? "true" : "false"}
      className={className}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}
