import Link from "next/link";
import { HeroAnalyzer } from "@/components/marketing/hero-analyzer";
import { HeroPixels } from "@/components/marketing/hero-pixels";

export function Hero() {
  return (
    <section className="hero hero--centerpiece">
      <HeroPixels />
      <div className="container hero__stack">
        <header className="hero__head">
          <span className="gf-tag hero__eyebrow">
            AI CONTRACT REVIEW · FREE FIRST SCAN
          </span>
          <h1 className="gf-h1 hero__title hero__title--compact">
            Get your contract{" "}
            <span style={{ color: "var(--green-500)" }}>green-flagged</span>.
          </h1>
          <p className="hero__sub hero__sub--compact">
            Drop any contract. Our AI scans every clause, ranks the risks, and
            tells you exactly what to push back on.
          </p>
        </header>

        <div className="hero__centerpiece">
          <div className="hero__centerpiece-main">
            <HeroAnalyzer />
          </div>
        </div>

        <div className="hero__foot">
          <div className="hero__cta">
            <Link href="/sign-in" className="gf-btn gf-btn-accent">
              Log in <span className="arrow">→</span>
            </Link>
            <Link href="/sign-up" className="gf-btn-link">
              Sign up free
            </Link>
          </div>
          <ul className="hero__trust">
            <li>
              <span className="trust-dot" />
              Encrypted in transit and at rest
            </li>
            <li>
              <span className="trust-dot" />
              Verdict in under 2 minutes
            </li>
            <li>
              <span className="trust-dot" />
              Informational, not legal advice
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
