import Link from "next/link";
import { DropZone } from "@/components/marketing/drop-zone";

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
            tells you exactly what to push back on — in plain English. Free. No
            account needed.
          </p>
          <div className="hero__cta">
            <Link href="#hero-drop" className="gf-btn">
              Scan one free <span className="arrow">→</span>
            </Link>
            <Link href="/how-it-works" className="gf-btn-link">
              How it works
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
          <DropZone />
        </div>
      </div>
    </section>
  );
}
