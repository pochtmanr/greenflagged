import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/sections/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Green Flagged to access your verdicts, saved contracts, and billing.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <section className="section auth-section">
      <div className="container">
        <div className="hero__grid auth-grid">
          <div className="hero__left">
            <span className="gf-tag">SIGN IN · GREEN FLAGGED</span>
            <h1 className="gf-h1">
              Welcome back to{" "}
              <span style={{ color: "var(--green-500)" }}>green-flagged</span>{" "}
              contracts.
            </h1>
            <p className="hero__sub">
              Sign in with Google or your email and password. New here? Create
              an account in seconds — sign-up is right inside the form.
            </p>
            <ul className="hero__trust">
              <li>
                <span className="trust-dot" />
                Google OAuth + password sign-in
              </li>
              <li>
                <span className="trust-dot" />
                Single-device session, revoke any time
              </li>
              <li>
                <span className="trust-dot" />
                We never store your contracts after the verdict
              </li>
            </ul>
          </div>
          <div>
            <Suspense fallback={null}>
              <SignInForm />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
