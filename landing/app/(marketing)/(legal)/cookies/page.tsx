import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookies used by Green Flagged.",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="May 2026">
      <p>
        Green Flagged uses the smallest set of cookies that gets the job done.
      </p>
      <p>
        <strong className="text-text-primary">Strictly necessary.</strong>{" "}
        Authentication and CSRF protection for signed-in users. These cannot
        be disabled.
      </p>
      <p>
        <strong className="text-text-primary">Analytics (opt-in).</strong>{" "}
        Plausible analytics — cookie-free, no personal data, no
        cross-site tracking. Used to measure aggregate site traffic.
      </p>
      <p>
        <strong className="text-text-primary">No advertising cookies.</strong>{" "}
        We do not run ads on this site and do not set advertising,
        retargeting, or third-party tracking cookies.
      </p>
      <p>You can clear cookies via your browser settings at any time.</p>
    </LegalPage>
  );
}
