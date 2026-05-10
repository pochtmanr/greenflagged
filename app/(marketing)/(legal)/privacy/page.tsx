import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Green Flagged handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="May 2026">
      <p>
        Green Flagged is operated by Holylabs Ltd. This policy explains what
        data we collect, why, and how long we keep it.
      </p>
      <p>
        <strong className="text-text-primary">What we collect.</strong> Email
        address and any contract you upload. Optionally: name, company,
        billing details (processed by Paddle, our merchant of record).
      </p>
      <p>
        <strong className="text-text-primary">How we use it.</strong>{" "}
        Contracts are processed to generate your verdict. Email is used to
        deliver your report and product updates (you can unsubscribe). Billing
        data is shared with Paddle solely to process payment.
      </p>
      <p>
        <strong className="text-text-primary">Where we store it.</strong>{" "}
        Data is stored in the EU. Contracts are encrypted in transit (TLS) and
        at rest. We do not train any AI model on your contract content.
      </p>
      <p>
        <strong className="text-text-primary">Retention.</strong> Free scans
        are auto-deleted within 30 days. Paid plans let you choose 30, 60, or
        90 days. Account and billing records are kept while your account is
        active and for as long as required by law afterward.
      </p>
      <p>
        <strong className="text-text-primary">Your rights (GDPR).</strong>{" "}
        Access, rectification, erasure, restriction, portability, objection,
        and the right to lodge a complaint with your supervisory authority.
        Email hello@greenflagged.app to exercise any right.
      </p>
      <p>
        <strong className="text-text-primary">Sub-processors.</strong>{" "}
        Hosting: Vercel (EU). Email: Resend. Payments: Paddle. AI inference:
        Anthropic (EU/US). DPAs are in place with each provider.
      </p>
    </LegalPage>
  );
}
