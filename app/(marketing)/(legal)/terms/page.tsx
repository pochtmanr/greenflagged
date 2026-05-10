import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of Green Flagged.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="May 2026">
      <p>
        Green Flagged is an informational service provided by Holylabs Ltd
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the service, you agree
        to these terms.
      </p>
      <p>
        <strong className="text-text-primary">Not legal advice.</strong> Green
        Flagged analyzes contracts and surfaces risk in plain English. Nothing
        on this site or in any generated report creates an attorney-client
        relationship, constitutes legal advice, or substitutes for advice from
        a licensed attorney in your jurisdiction.
      </p>
      <p>
        <strong className="text-text-primary">Your content.</strong> You
        retain all rights to contracts you upload. You grant us a limited
        license to process them solely to generate your report. We do not
        train any model on your contract content.
      </p>
      <p>
        <strong className="text-text-primary">Acceptable use.</strong> Do not
        upload content you don&apos;t have the right to share, content
        containing third-party personal data outside the parties to the
        contract, or content that violates applicable law.
      </p>
      <p>
        <strong className="text-text-primary">Subscriptions.</strong> Monthly
        plans cancel at the end of the current billing period. Annual plans
        are eligible for a 14-day full refund. Payments are processed by
        Paddle as merchant of record; their terms apply at checkout.
      </p>
      <p>
        <strong className="text-text-primary">Liability.</strong> The service
        is provided as-is. To the maximum extent permitted by law, our total
        liability under these terms is capped at the amount you paid us in the
        twelve months preceding the claim.
      </p>
      <p>
        <strong className="text-text-primary">Governing law.</strong> These
        terms are governed by the laws of England and Wales. Disputes are
        resolved in the courts of London, England.
      </p>
    </LegalPage>
  );
}
