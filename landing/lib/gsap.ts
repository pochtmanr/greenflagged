"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function registerGsap() {
  if (typeof window === "undefined") return;
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export { gsap, ScrollTrigger };

export function revealMaskedText(
  wrapper: HTMLElement,
  options: { delay?: number; stagger?: number } = {},
) {
  registerGsap();
  const targets = wrapper.querySelectorAll<HTMLElement>(".gs-reveal-text");
  if (!targets.length) return;
  gsap.fromTo(
    targets,
    { yPercent: 110 },
    {
      yPercent: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: options.stagger ?? 0.06,
      delay: options.delay ?? 0,
    },
  );
}

export function revealOnScroll(
  el: HTMLElement,
  options: { y?: number; delay?: number; duration?: number } = {},
) {
  registerGsap();
  gsap.fromTo(
    el,
    { y: options.y ?? 24, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: options.duration ?? 0.8,
      delay: options.delay ?? 0,
      ease: "expo.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        toggleActions: "play none none none",
      },
    },
  );
}
