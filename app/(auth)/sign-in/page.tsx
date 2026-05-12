import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/sections/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Green Flagged to access your verdicts, saved contracts, and billing.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 64,
          }}
          className="hero__grid"
        >
          <div className="hero__left">
            <span className="gf-tag">SIGN IN · MAGIC LINK · NO PASSWORDS</span>
            <h1 className="gf-h1">
              Welcome back to{" "}
              <span style={{ color: "var(--green-500)" }}>green-flagged</span>{" "}
              contracts.
            </h1>
            <p className="hero__sub">
              We&apos;ll send a one-time link to your inbox. No passwords, no
              tracking, no ceremony. New here?{" "}
              <Link
                href="/#hero-drop"
                style={{
                  color: "var(--fg-1)",
                  borderBottom: "1px solid currentColor",
                }}
              >
                Drop a contract first
              </Link>{" "}
              — sign-up happens after your first verdict.
            </p>
            <ul className="hero__trust">
              <li>
                <span className="trust-dot" />
                Magic link expires in 15 minutes
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
            <SignInForm />
          </div>
        </div>
      </div>
    </section>
  );
}
