import Link from "next/link";

export function CTA() {
  return (
    <section className="cta">
      <div className="container cta__inner">
        <div>
          <span className="gf-label cta__label">// LAST CALL</span>
          <h2 className="gf-h1 cta__title">Don&apos;t sign anything risky.</h2>
          <p className="cta__sub">
            Get a five-minute legal read for the price of a coffee. Free first
            scan, no account needed.
          </p>
        </div>
        <div className="cta__right">
          <Link href="/#hero-drop" className="gf-btn cta__btn">
            Scan one free <span className="arrow">→</span>
          </Link>
          <span className="gf-mono-sm cta__fineprint">
            encrypted · auto-deleted · informational, not legal advice
          </span>
        </div>
      </div>
    </section>
  );
}
