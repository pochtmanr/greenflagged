import { z } from "zod";
import { COUNTRIES } from "@/lib/countries";
import type { IndustrySchema, Question } from "../types";
import { FOOTER, clauses, fallback, formatCountry } from "../format";

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

export const ndaQuestions: Question[] = [
  {
    id: "mutual",
    kind: "toggle",
    label: "Mutual NDA? (off = one-way)",
    defaultValue: true,
  },
  {
    id: "disclosing_party",
    kind: "text",
    label: "Disclosing party",
    required: true,
    placeholder: "Legal name of the party disclosing information",
  },
  {
    id: "receiving_party",
    kind: "text",
    label: "Receiving party",
    required: true,
    placeholder: "Legal name of the party receiving information",
  },
  {
    id: "purpose",
    kind: "text",
    label: "Purpose of disclosure",
    multiline: true,
    required: true,
    placeholder: "Why are you sharing the information? (e.g. evaluate a partnership)",
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
  },
  {
    id: "carve_outs",
    kind: "checkbox-group",
    label: "Standard carve-outs",
    options: [...CARVE_OUT_OPTIONS],
    defaultValue: ["prior", "independent", "public", "legal"],
  },
  {
    id: "governing_law",
    kind: "select",
    label: "Governing law (country)",
    required: true,
    options: COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
  },
];

const validator = z.object({
  mutual: z.coerce.boolean().default(true),
  disclosing_party: z.string().trim().min(1),
  receiving_party: z.string().trim().min(1),
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

  const partiesRole = a.mutual
    ? `("Party A") and ${a.receiving_party} ("Party B"). Each Party may disclose Confidential Information to the other and each Party is bound by the same obligations as Receiving Party in respect of Confidential Information it receives.`
    : `("Disclosing Party") and ${a.receiving_party} ("Receiving Party").`;

  const parties = clauses("Parties", [
    `This Non-Disclosure Agreement (the "Agreement") is entered into between ${fallback(a.disclosing_party, "Disclosing party legal name")} ${partiesRole}`,
    `The Parties wish to share information for the following purpose: ${fallback(a.purpose, "purpose of disclosure to be inserted")} (the "Purpose").`,
  ]);

  const confidential = clauses("Confidential Information", [
    "'Confidential Information' means any non-public information disclosed by one Party to the other, whether written, oral, or in any other form, that is identified as confidential or that a reasonable person would understand to be confidential under the circumstances.",
    "Confidential Information does not include information that " +
      a.carve_outs.map((k) => CARVE_OUT_TEXT[k]).filter(Boolean).join("; or ") +
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
    `*Between ${a.disclosing_party} and ${a.receiving_party}*`,
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
  return `${kind} — ${parsed.data.disclosing_party} & ${parsed.data.receiving_party}`;
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
