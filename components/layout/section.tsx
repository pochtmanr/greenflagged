"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { revealOnScroll } from "@/lib/gsap";

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  /** Vertical padding scale. `lg` = 96px (default), `md` = 64px, `sm` = 48px, `flush` = 0. */
  pad?: "flush" | "sm" | "md" | "lg";
  /** Enable GSAP fade-up reveal on scroll. Default true. */
  reveal?: boolean;
  /** Heading label (small uppercase eyebrow). */
  eyebrow?: string;
  /** ID used for nav anchors. */
  id?: string;
};

export function Section({
  className,
  pad = "lg",
  reveal = true,
  eyebrow,
  id,
  children,
  ...props
}: SectionProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!reveal || !ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    revealOnScroll(ref.current);
  }, [reveal]);

  const padding =
    pad === "flush"
      ? "py-0"
      : pad === "sm"
        ? "py-12"
        : pad === "md"
          ? "py-16 md:py-20"
          : "py-20 md:py-32";

  return (
    <section
      ref={ref}
      id={id}
      className={cn("relative w-full", padding, className)}
      {...props}
    >
      {eyebrow ? (
        <div className="mx-auto mb-12 w-full max-w-[1440px] px-4 md:px-8 lg:px-12">
          <span className="text-label text-green-300">{eyebrow}</span>
        </div>
      ) : null}
      {children}
    </section>
  );
}
