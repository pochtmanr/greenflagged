"use client";

import Image from "next/image";
import * as React from "react";
import { LANDING_ART } from "@/lib/landing/images";
import { Reveal } from "./reveal";

/**
 * Full-bleed painted band between Sample Verdict and Pricing. Acts as a
 * narrative breath — picks up the painterly aesthetic, no decoration overload.
 */
export function ArtInterlude() {
  const art = LANDING_ART.intermission;
  const imgWrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const wrap = imgWrapRef.current;
    if (!wrap) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom < 0 || rect.top > vh) return;
      // -1 (section just entering from below) → 1 (section just leaving above)
      const progress =
        (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      // Move the image opposite to scroll for parallax.
      const shift = -clamped * 60; // px
      wrap.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Reveal as="section" className="art-interlude" cssIndex={0}>
      <div className="art-interlude__image" ref={imgWrapRef}>
        <Image
          src={art.src}
          alt={art.alt}
          fill
          sizes="100vw"
          priority={false}
          quality={85}
        />
      </div>
      <div className="art-interlude__overlay">
        <div className="container art-interlude__inner">
          <div className="art-interlude__panel">
            <span className="gf-label art-interlude__eyebrow">
              // INTERMISSION · ON THE WEIGHT OF SMALL PRINT
            </span>
            <p className="art-interlude__pull">
              Every contract is someone standing in the rain, hoping the words
              above them mean what they think they mean. We just turn the lights
              on.
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
