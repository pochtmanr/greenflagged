import type { Metadata } from "next";
import { LegalPage } from "@/components/sections/legal-page";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Legal information required under § 5 TMG.",
};

export default function ImprintPage() {
  return (
    <LegalPage title="Imprint / Impressum" updated="May 2026">
      <p>Information per § 5 TMG and Art. 14 ODR Regulation.</p>
      <p>
        <strong className="text-text-primary">Operator:</strong> Holylabs Ltd
        <br />
        Registered office: London, England
        <br />
        Company number: [TBD]
        <br />
        Email: hello@greenflagged.xyz
      </p>
      <p>
        <strong className="text-text-primary">VAT.</strong> EU VAT is
        collected and remitted by Paddle.com Market Ltd (our merchant of
        record).
      </p>
      <p>
        <strong className="text-text-primary">Responsible for content per § 55 Abs. 2 RStV:</strong>{" "}
        Holylabs Ltd, address as above.
      </p>
      <p>
        <strong className="text-text-primary">EU online dispute resolution:</strong>{" "}
        <a
          className="text-green-300 hover:underline"
          href="https://ec.europa.eu/consumers/odr/"
        >
          ec.europa.eu/consumers/odr
        </a>
        . We are not obliged, nor willing, to participate in dispute
        resolution proceedings before a consumer arbitration board.
      </p>
    </LegalPage>
  );
}
