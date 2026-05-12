const STATS = [
  { v: "10k+", l: "Contracts scanned" },
  { v: "92%", l: "Felt more confident signing" },
  { v: "8 min", l: "Average time to verdict" },
];

export function TrustRow() {
  return (
    <section className="section section--thin">
      <div className="container trust">
        {STATS.map((s, i) => (
          <div
            key={i}
            className={
              "trust__cell " + (i < STATS.length - 1 ? "trust__cell--rail" : "")
            }
          >
            <div className="trust__v">{s.v}</div>
            <div className="gf-label trust__l">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
