import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/sections/sign-in-form";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create your Green Flagged account to scan and draft contracts with AI redlines.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <section className="section auth-section">
      <div className="container">
        <div className="hero__grid auth-grid">
          <div className="hero__left">
            <span className="gf-tag">SIGN UP · GREEN FLAGGED</span>
            <h1 className="gf-h1">
              Start{" "}
              <span style={{ color: "var(--green-500)" }}>green-flagging</span>{" "}
              your contracts.
            </h1>
            <p className="hero__sub">
              Free first scan, no credit card. Sign up with Google or email and
              we&apos;ll get you to your dashboard in under a minute.
            </p>
            <ul className="hero__trust">
              <li>
                <span className="trust-dot" />
                Free first scan
              </li>
              <li>
                <span className="trust-dot" />
                Cancel any time
              </li>
              <li>
                <span className="trust-dot" />
                We never store your contracts after the verdict
              </li>
            </ul>
          </div>
          <div>
            <Suspense fallback={null}>
              <SignInForm defaultMode="sign-up" />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
