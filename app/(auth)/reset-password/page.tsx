import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Green Flagged account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
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
            <span className="gf-tag">SET NEW PASSWORD</span>
            <h1 className="gf-h1">
              Choose a{" "}
              <span style={{ color: "var(--green-500)" }}>new password</span>.
            </h1>
            <p className="hero__sub">
              At least 8 characters. You&apos;ll be signed in automatically
              after saving.
            </p>
          </div>
          <div>
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </section>
  );
}
