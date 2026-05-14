import Link from "next/link";
import { HeroAnalyzer } from "@/components/marketing/hero-analyzer";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden />
      <div className="container hero__grid">
        <div className="hero__left">
          <span className="gf-tag">AI CONTRACT REVIEW · FREE FIRST SCAN</span>
          <h1 className="gf-display hero__title">
            Get your contract{" "}
            <span style={{ color: "var(--green-500)" }}>green-flagged</span>.
          </h1>
          <p className="hero__sub">
            Drop any contract. Our AI scans every clause, ranks the risks, and
            tells you exactly what to push back on — in plain English.
          </p>
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
        <div>
          <HeroAnalyzer />
        </div>
      </div>
    </section>
  );
}
