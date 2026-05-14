type Props = {
  count?: number;
};

// Tiny deterministic PRNG so SSR + CSR produce identical positions.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Atmospheric layer of vertical pixel streaks falling slowly. Pure CSS animation,
 * no JS at runtime. Positioned absolutely — host must be `position: relative`.
 */
export function FallingStreaks({ count = 22 }: Props) {
  const rand = seeded(1337);
  const streaks = Array.from({ length: count }, (_, i) => {
    const left = rand() * 100;
    const height = 28 + rand() * 80;
    const duration = 5 + rand() * 5;
    const delay = -rand() * duration;
    const opacity = 0.07 + rand() * 0.12;
    const width = rand() > 0.65 ? 1.5 : 1;
    return { i, left, height, duration, delay, opacity, width };
  });

  return (
    <div className="falling-streaks" aria-hidden="true">
      {streaks.map((s) => (
        <span
          key={s.i}
          className="falling-streaks__streak"
          style={{
            left: `${s.left.toFixed(3)}%`,
            height: `${s.height.toFixed(1)}px`,
            width: `${s.width}px`,
            opacity: s.opacity.toFixed(3),
            animationDuration: `${s.duration.toFixed(2)}s`,
            animationDelay: `${s.delay.toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}
