// Targeted per-country legal layer. Eight jurisdictions, each supplying:
//  1. A governing-law / dispute-forum sentence that replaces the generic clause
//     "This Agreement is governed by the laws of {country}…" in the contract body.
//  2. Optional rider clause text the user can toggle on for the one biggest local
//     gotcha in that jurisdiction.
//  3. Inline notes that surface in the wizard under the dropdown so users
//     understand what the country choice and the rider actually do.
//
// This is editorial template content, not legal advice. Every rendered contract
// also includes a non-removable footer reminding the reader to have a lawyer
// review country-specific requirements.

export type JurisdictionCode =
  | "DE"
  | "EU"
  | "US"
  | "UK"
  | "IL"
  | "SG"
  | "IN"
  | "AE";

export type JurisdictionRider = {
  id: string;
  label: string;
  description: string;
  body: string;
};

export type Jurisdiction = {
  code: JurisdictionCode;
  label: string;
  governing_law_sentence: string;
  rider?: JurisdictionRider;
  notes: string;
};

export const JURISDICTIONS: Jurisdiction[] = [
  {
    code: "DE",
    label: "Germany",
    governing_law_sentence:
      "This Agreement is governed by the laws of the Federal Republic of Germany, excluding its conflict-of-laws rules and the UN Convention on Contracts for the International Sale of Goods. The Parties submit to the exclusive jurisdiction of the courts at the Provider's registered seat.",
    rider: {
      id: "werkvertrag_note",
      label: "Werkvertrag designation (recommended for DE)",
      description:
        "Confirms the engagement is a project-result contract (Werkvertrag) rather than employment, reducing the risk of misclassification claims.",
      body:
        "The Parties expressly agree that this engagement is a Werkvertrag (contract for work) under §§ 631 ff. BGB and not employment within the meaning of § 7 SGB IV. The Provider is not bound by Client instructions as to time, place, or manner of performance beyond what is required to deliver the agreed result, and the Provider remains free to perform similar work for other clients.",
    },
    notes:
      "German law treats freelance engagements as Werkvertrag (project) or Dienstvertrag (service). The optional rider flags the Werkvertrag designation, which is the safer default for project-based freelance work.",
  },
  {
    code: "EU",
    label: "European Union (B2B, non-DE)",
    governing_law_sentence:
      "This Agreement is governed by the laws of the EU Member State where the Provider has its registered seat, excluding its conflict-of-laws rules. The Parties submit to the exclusive jurisdiction of the competent courts at that seat.",
    rider: {
      id: "vat_reverse_charge",
      label: "VAT reverse-charge (B2B EU)",
      description:
        "Adds the standard EU B2B VAT reverse-charge sentence to the payment clause when both parties are VAT-registered in different Member States.",
      body:
        "Where the Client is a taxable person registered for VAT in another EU Member State and provides the Provider with a valid VAT identification number, invoices will be issued without VAT and the reverse-charge mechanism under Article 196 of Directive 2006/112/EC applies. The Client is responsible for self-accounting for VAT in its own jurisdiction.",
    },
    notes:
      "Use this for cross-border B2B work between EU Member States other than Germany. The rider adds the standard VAT reverse-charge wording when both parties are VAT-registered.",
  },
  {
    code: "US",
    label: "United States",
    governing_law_sentence:
      "This Agreement is governed by the laws of the State of the Provider's principal place of business, excluding its conflict-of-laws rules. The Parties submit to the exclusive jurisdiction of the state and federal courts located in that State.",
    rider: {
      id: "ic_1099",
      label: "Independent-contractor (1099) classification",
      description:
        "Adds an explicit independent-contractor classification statement. Recommended when invoicing U.S. clients to reduce employee-misclassification risk.",
      body:
        "The Provider is engaged as an independent contractor and not as an employee, agent, partner, or joint venturer of the Client. The Provider is solely responsible for all federal, state, and local taxes on amounts paid under this Agreement, including self-employment tax, and will receive Form 1099 (or equivalent) where required. The Provider is not entitled to employee benefits, unemployment insurance, workers' compensation, or similar entitlements through the Client.",
    },
    notes:
      "U.S. law is state-specific — this template uses the Provider's home state. The optional rider locks in 1099 contractor status, which is the most common classification dispute.",
  },
  {
    code: "UK",
    label: "United Kingdom",
    governing_law_sentence:
      "This Agreement is governed by the laws of England and Wales, and the Parties submit to the exclusive jurisdiction of the courts of England and Wales.",
    rider: {
      id: "ir35_outside",
      label: "IR35 outside-scope statement",
      description:
        "Confirms the engagement is an off-payroll services contract outside the scope of IR35. Important when contracting with UK clients via a personal-service company.",
      body:
        "The Parties intend that this Agreement is a contract for services outside the scope of the off-payroll working rules at sections 61M to 61X of the Income Tax (Earnings and Pensions) Act 2003 (\"IR35\"). The Provider has the right to provide a substitute, is not subject to the Client's day-to-day control as to the manner of performance, and bears genuine financial risk. The Provider is responsible for its own tax and National Insurance.",
    },
    notes:
      "England-and-Wales jurisdiction by default. The optional IR35 rider matters when invoicing UK clients through a personal-service company — it documents the off-payroll position.",
  },
  {
    code: "IL",
    label: "Israel",
    governing_law_sentence:
      "This Agreement is governed by the laws of the State of Israel, excluding its conflict-of-laws rules. The Parties submit to the exclusive jurisdiction of the competent courts of Tel Aviv-Yafo.",
    rider: {
      id: "hebrew_translation",
      label: "Hebrew translation note",
      description:
        "Adds a sentence noting that the English version is authoritative and that a certified Hebrew translation may be required if enforced before an Israeli court.",
      body:
        "This Agreement is executed in English, which version is binding between the Parties. The Parties acknowledge that enforcement before an Israeli court may require submission of a certified Hebrew translation, the cost of which will be borne by the Party seeking enforcement.",
    },
    notes:
      "Tel Aviv courts by default. The optional rider clarifies that the English version is authoritative while leaving room for a certified Hebrew translation if litigation reaches an Israeli court.",
  },
  {
    code: "SG",
    label: "Singapore",
    governing_law_sentence:
      "This Agreement is governed by the laws of the Republic of Singapore. Any dispute arising out of or in connection with this Agreement, including any question regarding its existence, validity, or termination, shall be referred to and finally resolved by arbitration administered by the Singapore International Arbitration Centre (SIAC) in accordance with the SIAC Rules in force at the time of the notice of arbitration. The seat of the arbitration shall be Singapore.",
    rider: {
      id: "siac_expedited",
      label: "SIAC expedited procedure",
      description:
        "Opts in to SIAC's expedited procedure for disputes under SGD 6 million — faster, cheaper, single arbitrator by default.",
      body:
        "Where the amount in dispute does not exceed SGD 6,000,000, the Parties agree that the arbitration shall be conducted under the Expedited Procedure provided for in the SIAC Rules.",
    },
    notes:
      "Common-law jurisdiction with SIAC arbitration baked into the default clause — the standard choice for cross-border SE-Asia work. The optional rider opts in to the expedited procedure for smaller disputes.",
  },
  {
    code: "IN",
    label: "India",
    governing_law_sentence:
      "This Agreement is governed by the laws of India. The Parties submit to the exclusive jurisdiction of the courts at the Provider's registered place of business.",
    rider: {
      id: "stamp_duty",
      label: "Stamp duty allocation",
      description:
        "Allocates responsibility for Indian stamp duty (which varies by state) to the Client and includes the standard Indian Contract Act 1872 reference.",
      body:
        "Any stamp duty payable on this Agreement under the Indian Stamp Act, 1899 (or applicable state stamp laws) shall be borne by the Client. The Parties acknowledge that this Agreement is governed by the Indian Contract Act, 1872, and the Information Technology Act, 2000 to the extent applicable to electronic execution.",
    },
    notes:
      "India-jurisdiction default. Stamp duty rates vary by state — the optional rider assigns the cost to the Client, which is the freelance-friendly position.",
  },
  {
    code: "AE",
    label: "United Arab Emirates",
    governing_law_sentence:
      "This Agreement is governed by the laws of the United Arab Emirates as applied in the Emirate of the Provider's registered seat. The Parties submit to the exclusive jurisdiction of the competent onshore courts of that Emirate, save where the Provider's seat is within a financial free zone (DIFC or ADGM), in which case the courts of that free zone shall have exclusive jurisdiction.",
    rider: {
      id: "difc_jurisdiction",
      label: "DIFC / ADGM free-zone jurisdiction",
      description:
        "Routes disputes to the common-law courts of DIFC (Dubai) or ADGM (Abu Dhabi) rather than UAE onshore civil courts. Recommended when both parties are registered in or contracting through a free zone.",
      body:
        "Notwithstanding the foregoing, the Parties irrevocably agree that the courts of the Dubai International Financial Centre (DIFC) or, where applicable, the Abu Dhabi Global Market (ADGM) shall have exclusive jurisdiction to settle any dispute arising out of or in connection with this Agreement, applying English-language common-law procedure.",
    },
    notes:
      "UAE law is split between onshore civil-law courts and the free-zone common-law courts (DIFC, ADGM). The optional rider opts in to DIFC/ADGM jurisdiction, which is the typical choice for international tech and freelance work.",
  },
];

const BY_CODE = new Map<string, Jurisdiction>(
  JURISDICTIONS.map((j) => [j.code, j]),
);

export function isJurisdictionCode(value: unknown): value is JurisdictionCode {
  return typeof value === "string" && BY_CODE.has(value);
}

export function getJurisdiction(
  code: string | null | undefined,
): Jurisdiction | null {
  if (!code) return null;
  return BY_CODE.get(code) ?? null;
}

export const JURISDICTION_OPTIONS = JURISDICTIONS.map((j) => ({
  value: j.code,
  label: j.label,
}));
