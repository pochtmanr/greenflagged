import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Send a one-time link to reset your Green Flagged password.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
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
            <span className="gf-tag">FORGOT PASSWORD</span>
            <h1 className="gf-h1">
              Reset your{" "}
              <span style={{ color: "var(--green-500)" }}>password</span>.
            </h1>
            <p className="hero__sub">
              Enter your email and we&apos;ll send a one-time link to set a new
              password. The link expires in 15 minutes.
            </p>
          </div>
          <div>
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </section>
  );
}
