"use client";

import * as React from "react";

function subscribeReducedMotion(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return false;
}

type DotMatrixCanvasProps = {
  className?: string;
  /** Pixel spacing between dots in the grid. */
  spacing?: number;
  /** Base dot radius in CSS pixels. */
  dotRadius?: number;
  /** Pulse cycle in seconds. */
  cycleSeconds?: number;
  /** CSS opacity ceiling. */
  opacity?: number;
};

/**
 * Inset canvas accent — dot-matrix particle field with a slow breathing
 * pulse and pointer-reactive drift. Falls back to a static CSS grid when
 * the user prefers reduced motion.
 */
export function DotMatrixCanvas({
  className,
  spacing = 32,
  dotRadius = 1.1,
  cycleSeconds = 6,
  opacity = 0.45,
}: DotMatrixCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const reduced = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  React.useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    let raf = 0;
    const start = performance.now();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handlePointer = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
    };
    const clearPointer = () => {
      pointerX = -9999;
      pointerY = -9999;
    };

    const render = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const pulse = 0.5 + 0.5 * Math.sin((t / cycleSeconds) * Math.PI * 2);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          const phaseOffset = (i * 0.13 + j * 0.17) % (Math.PI * 2);
          const localPulse =
            0.4 + 0.6 *
              (0.5 + 0.5 * Math.sin((t / cycleSeconds) * Math.PI * 2 + phaseOffset));

          // Pointer drift
          const dx = x - pointerX;
          const dy = y - pointerY;
          const dist = Math.hypot(dx, dy);
          const influence = Math.max(0, 1 - dist / 240);
          const driftX = (dx / (dist || 1)) * influence * 6;
          const driftY = (dy / (dist || 1)) * influence * 6;

          const r = dotRadius * (1 + influence * 0.6);
          const alpha = opacity * localPulse * (0.6 + pulse * 0.4);

          ctx.beginPath();
          ctx.fillStyle = `rgba(0, 230, 118, ${alpha})`;
          ctx.arc(x + driftX, y + driftY, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointer);
    window.addEventListener("pointerleave", clearPointer);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("pointerleave", clearPointer);
    };
  }, [spacing, dotRadius, cycleSeconds, opacity, reduced]);

  if (reduced) {
    return (
      <div
        aria-hidden
        className={`dot-matrix-fallback pointer-events-none fixed inset-0 -z-10 ${className ?? ""}`}
        style={{ opacity }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 ${className ?? ""}`}
    />
  );
}
