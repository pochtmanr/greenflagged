import type { CSSProperties } from "react";

type Props = {
  seed?: number;
  cellPx?: number;
  cols?: number;
  rows?: number;
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const SQRT2 = Math.SQRT2;

type Block = {
  key: string;
  anchor: "TR" | "BL";
  cellFromHorizontalEdge: number;
  cellFromVerticalEdge: number;
  tier: 1 | 2 | 3 | 4;
  duration: number;
  delay: number;
};

/**
 * Pixel-storm background: deterministic grid of green blocks clustered toward
 * the top-right and bottom-left corners, fading to empty through the centre
 * so the HeroAnalyzer centerpiece stays clear. Blocks are anchored to their
 * nearest corner with `right`/`top` or `left`/`bottom` so the cluster hugs
 * the viewport edge at any width. Pure CSS animation, no runtime JS.
 */
export function HeroPixels({
  seed = 4242,
  cellPx = 22,
  cols = 64,
  rows = 32,
}: Props = {}) {
  const rand = seeded(seed);
  const blocks: Block[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = c / (cols - 1);
      const ny = r / (rows - 1);
      const dTR = Math.hypot(1 - nx, ny) / SQRT2;
      const dBL = Math.hypot(nx, 1 - ny) / SQRT2;
      const anchor: "TR" | "BL" = dTR <= dBL ? "TR" : "BL";
      const weight = 1 - Math.min(dTR, dBL);

      const probe = rand();
      const tierRoll = rand();
      const durRoll = rand();
      const delayRoll = rand();

      if (probe >= Math.pow(weight, 1.8)) continue;

      const tier: 1 | 2 | 3 | 4 =
        tierRoll < 0.42 ? 1 : tierRoll < 0.72 ? 2 : tierRoll < 0.9 ? 3 : 4;
      const duration = 9 + durRoll * 13;
      const delay = -delayRoll * duration;

      blocks.push({
        key: `${r}-${c}`,
        anchor,
        cellFromHorizontalEdge: anchor === "TR" ? cols - 1 - c : c,
        cellFromVerticalEdge: anchor === "TR" ? r : rows - 1 - r,
        tier,
        duration,
        delay,
      });
    }
  }

  return (
    <div className="hero-pixels" aria-hidden="true">
      {blocks.map((b) => {
        const horiz =
          b.anchor === "TR"
            ? { right: `${b.cellFromHorizontalEdge * cellPx}px` }
            : { left: `${b.cellFromHorizontalEdge * cellPx}px` };
        const vert =
          b.anchor === "TR"
            ? { top: `${b.cellFromVerticalEdge * cellPx}px` }
            : { bottom: `${b.cellFromVerticalEdge * cellPx}px` };
        return (
          <span
            key={b.key}
            className="hero-pixels__block"
            style={{
              ...horiz,
              ...vert,
              width: `${cellPx}px`,
              height: `${cellPx}px`,
              ["--tier" as string]: String(b.tier),
              ["--dur" as string]: `${b.duration.toFixed(2)}s`,
              animationDelay: `${b.delay.toFixed(2)}s`,
            } as CSSProperties}
          />
        );
      })}
    </div>
  );
}
