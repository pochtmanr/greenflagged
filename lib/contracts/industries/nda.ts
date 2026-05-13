import { z } from "zod";
import { COUNTRIES, COUNTRY_CODES } from "@/lib/countries";
import type { IndustrySchema, Question } from "../types";
import {
  FOOTER,
  clauses,
  fallback,
  formatAddress,
  formatCountry,
  formatParty,
} from "../format";

const CARVE_OUT_OPTIONS = [
  { value: "prior", label: "Prior knowledge" },
  { value: "independent", label: "Independently developed" },
  { value: "public", label: "Publicly known" },
  { value: "legal", label: "Required by law" },
] as const;

const CARVE_OUT_TEXT: Record<string, string> = {
  prior:
    "was already known to the Receiving Party at the time of disclosure, free of any obligation of confidentiality",
  independent:
    "is independently developed by the Receiving Party without reference to the Disclosing Party's Confidential Information",
  public:
    "is or becomes publicly known through no fault of the Receiving Party",
  legal:
    "is required to be disclosed by law, court order, or government authority (provided the Receiving Party gives prompt notice where lawfully permitted)",
};

const TOOLTIP_SURVIVAL =
  "If ON: the confidentiality obligations continue after the NDA ends. Usual for trade secrets — they don't stop being secret when the contract expires.";
const TOOLTIP_CARVE_OUTS =
  "Information that isn't covered by the NDA. The 4 default carve-outs are standard: things the receiving party already knew, developed independently, became public, or has to disclose by law.";
const TOOLTIP_GOVERNING_LAW =
  "The country (and by extension, court system) whose laws interpret this contract if you end up in dispute. Pick where the provider is based — easier to enforce locally. Cross-border disputes are expensive.";

export const ndaQuestions: Question[] = [
  {
    id: "mutual",
    kind: "toggle",
    label: "Mutual NDA? (off = one-way)",
    defaultValue: true,
  },
  {
    id: "disclosing_party",
    kind: "name-group",
    label: "Disclosing party",
    required: true,
    showBusiness: true,
    help: "The party sharing confidential information.",
  },
  {
    id: "disclosing_party_address",
    kind: "address",
    label: "Disclosing party address",
    required: true,
  },
  {
    id: "receiving_party",
    kind: "name-group",
    label: "Receiving party",
    required: true,
    showBusiness: true,
    help: "The party receiving confidential information.",
  },
  {
    id: "receiving_party_address",
    kind: "address",
    label: "Receiving party address",
    required: true,
  },
  {
    id: "purpose",
    kind: "text",
    label: "Purpose of disclosure",
    multiline: true,
    required: true,
    placeholder:
      "Why are you sharing the information? (e.g. evaluate a partnership)",
  },
  {
    id: "term_years",
    kind: "number",
    label: "Term (years)",
    suffix: "years",
    defaultValue: 3,
    min: 1,
    max: 10,
    required: true,
  },
  {
    id: "survival",
    kind: "toggle",
    label: "Confidentiality survives termination?",
    defaultValue: true,
    tooltip: TOOLTIP_SURVIVAL,
  },
  {
    id: "carve_outs",
    kind: "checkbox-group",
    label: "Standard carve-outs",
    options: [...CARVE_OUT_OPTIONS],
    defaultValue: ["prior", "independent", "public", "legal"],
    tooltip: TOOLTIP_CARVE_OUTS,
  },
  {
    id: "governing_law",
    kind: "select",
    label: "Governing law (country)",
    required: true,
    tooltip: TOOLTIP_GOVERNING_LAW,
    options: COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
  },
];

const NameSchema = z.object({
  first: z.string().trim().min(1),
  family: z.string().trim().min(1),
  business: z.string().trim().optional().default(""),
});

const AddressSchema = z.object({
  country: z
    .string()
    .length(2)
    .refine((c) => COUNTRY_CODES.has(c)),
  city: z.string().trim().min(1),
  street: z.string().trim().min(1),
  postal: z.string().trim().min(1),
});

const validator = z.object({
  mutual: z.coerce.boolean().default(true),
  disclosing_party: NameSchema,
  disclosing_party_address: AddressSchema,
  receiving_party: NameSchema,
  receiving_party_address: AddressSchema,
  purpose: z.string().trim().min(1),
  term_years: z.coerce.number().int().min(1).max(10).default(3),
  survival: z.coerce.boolean().default(true),
  carve_outs: z
    .array(z.enum(["prior", "independent", "public", "legal"]))
    .default(["prior", "independent", "public", "legal"]),
  governing_law: z.string().min(2),
});

type NdaAnswers = z.infer<typeof validator>;

function render(raw: Record<string, unknown>): string {
  const a = validator.parse(raw) as NdaAnswers;
  const discloser = formatParty(a.disclosing_party);
  const discloserAddr = formatAddress(a.disclosing_party_address);
  const receiver = formatParty(a.receiving_party);
  const receiverAddr = formatAddress(a.receiving_party_address);

  const partiesRole = a.mutual
    ? `("Party A"), at ${discloserAddr}, and ${receiver} ("Party B"), at ${receiverAddr}. Each Party may disclose Confidential Information to the other and each Party is bound by the same obligations as Receiving Party in respect of Confidential Information it receives.`
    : `("Disclosing Party"), at ${discloserAddr}, and ${receiver} ("Receiving Party"), at ${receiverAddr}.`;

  const parties = clauses("Parties", [
    `This Non-Disclosure Agreement (the "Agreement") is entered into between ${discloser} ${partiesRole}`,
    `The Parties wish to share information for the following purpose: ${fallback(a.purpose, "purpose of disclosure to be inserted")} (the "Purpose").`,
  ]);

  const confidential = clauses("Confidential Information", [
    "'Confidential Information' means any non-public information disclosed by one Party to the other, whether written, oral, or in any other form, that is identified as confidential or that a reasonable person would understand to be confidential under the circumstances.",
    "Confidential Information does not include information that " +
      a.carve_outs
        .map((k) => CARVE_OUT_TEXT[k])
        .filter(Boolean)
        .join("; or ") +
      ".",
  ]);

  const obligations = clauses("Obligations", [
    `${a.mutual ? "Each Party" : "The Receiving Party"} will (a) use the Confidential Information solely for the Purpose, (b) protect it with the same care as it uses for its own confidential information (and no less than reasonable care), and (c) limit access to employees, contractors, and advisors who need to know and who are bound by confidentiality obligations no less protective than this Agreement.`,
    `${a.mutual ? "Each Party" : "The Receiving Party"} will not disclose Confidential Information to any third party without the prior written consent of the disclosing Party.`,
    `${a.mutual ? "Each Party" : "The Receiving Party"} will, on request, return or destroy Confidential Information in its possession, subject to applicable legal retention requirements.`,
  ]);

  const term = clauses("Term", [
    `This Agreement starts on the date of last signature and continues for ${fallback(a.term_years, "the agreed number of")} year(s).`,
    a.survival
      ? `The obligations of confidentiality survive the termination of this Agreement and continue for an additional ${fallback(a.term_years, "the agreed number of")} year(s) for ordinary Confidential Information, and indefinitely for trade secrets.`
      : "The obligations of confidentiality terminate with this Agreement, except as required by law.",
  ]);

  const general = clauses("General", [
    `This Agreement is governed by the laws of ${formatCountry(a.governing_law)} without reference to its conflict-of-laws rules. The Parties submit to the exclusive jurisdiction of the courts of that country.`,
    "This Agreement is the entire agreement between the Parties on its subject matter and supersedes prior discussions.",
    "If any provision is held unenforceable, the remaining provisions remain in full force.",
    "Amendments require a writing signed (or electronically acknowledged) by both Parties.",
    "Nothing in this Agreement grants either Party any licence in the other Party's intellectual property except the limited right to use Confidential Information for the Purpose.",
  ]);

  const signatures = clauses("Signatures", [
    `**${a.mutual ? "Party A" : "Disclosing Party"}:** ____________________________   Date: ____________`,
    `**${a.mutual ? "Party B" : "Receiving Party"}:** ____________________________   Date: ____________`,
  ]);

  return [
    `# ${a.mutual ? "Mutual" : "One-Way"} Non-Disclosure Agreement`,
    `*Between ${discloser} and ${receiver}*`,
    parties,
    confidential,
    obligations,
    term,
    general,
    signatures,
    FOOTER(),
  ].join("\n\n");
}

function buildTitle(raw: Record<string, unknown>): string {
  const parsed = validator.safeParse(raw);
  if (!parsed.success) return "Non-Disclosure Agreement";
  const kind = parsed.data.mutual ? "Mutual NDA" : "One-Way NDA";
  const d = formatParty(parsed.data.disclosing_party);
  const r = formatParty(parsed.data.receiving_party);
  return `${kind} — ${d} & ${r}`;
}

export const nda: IndustrySchema = {
  id: "nda",
  label: "NDA",
  description: "Mutual or one-way non-disclosure agreement.",
  questions: ndaQuestions,
  validator,
  render,
  buildTitle,
};
