import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/countries";
import type { IndustrySchema, Question } from "../types";
import {
  FOOTER,
  clauses,
  fallback,
  formatAddress,
  formatCurrency,
  formatDate,
  formatParty,
} from "../format";
import { JURISDICTION_OPTIONS, getJurisdiction } from "../jurisdictions";

const RATE_TYPE_LABEL: Record<string, string> = {
  hourly: "an hourly rate",
  fixed: "a fixed project fee",
  retainer: "a monthly retainer",
};

const RATE_TYPE_UNIT: Record<string, string> = {
  hourly: "per hour",
  fixed: "for the full project",
  retainer: "per month",
};

const PAYMENT_SCHEDULE_LABEL: Record<string, string> = {
  on_completion: "in full upon completion of the work",
  milestones: "in milestone payments tied to the deliverables",
  net_15: "within 15 days of each invoice",
  net_30: "within 30 days of each invoice",
};

const IP_TRANSFER_LABEL: Record<string, string> = {
  on_full_payment:
    "All rights in the final deliverables transfer to the Client upon receipt of full payment. Until full payment, the Provider retains all rights.",
  on_signature:
    "All rights in the final deliverables transfer to the Client upon signature of this Agreement, regardless of payment status.",
  retained_until_paid:
    "The Provider retains all rights in the deliverables. The Client receives a worldwide, non-exclusive licence to use them once full payment is made.",
};

const RATE_TYPE_OPT_DESC: Record<string, string> = {
  hourly: "You bill for hours worked. Best for ongoing maintenance or unscoped work.",
  fixed: "One total price for a defined deliverable. Best when scope is clear.",
  retainer: "A recurring monthly amount. Best for long engagements.",
};

const PAYMENT_SCHEDULE_OPT_DESC: Record<string, string> = {
  on_completion: "Invoice is due when the work is delivered.",
  milestones: "Invoices follow named milestones in the scope.",
  net_15: "Invoices are due 15 days after issue.",
  net_30: "Invoices are due 30 days after issue.",
};

const IP_TRANSFER_OPT_DESC: Record<string, string> = {
  on_full_payment:
    "Recommended design norm. Rights transfer to the Client once you've been paid in full.",
  on_signature:
    "Risky for you — rights transfer the moment the contract is signed, before payment.",
  retained_until_paid:
    "You keep rights; Client gets a licence to use the work once paid in full.",
};

const HELP_GOVERNING_LAW =
  "The legal system that interprets this contract. Pick where you (the Designer) are based — easier and cheaper to enforce locally.";

function clientNameFor(answers: Record<string, unknown>): string {
  const client = answers.client as
    | { first?: string; family?: string; business?: string }
    | undefined;
  if (!client) return "The Client";
  const business = client.business?.trim();
  if (business) return business;
  const personal = [client.first, client.family].filter(Boolean).join(" ").trim();
  return personal || "The Client";
}

export const designQuestions: Question[] = [
  {
    id: "client",
    kind: "name-group",
    label: "Client",
    required: true,
    showBusiness: true,
  },
  {
    id: "client_address",
    kind: "address",
    label: "Client address",
    required: true,
  },
  {
    id: "provider",
    kind: "name-group",
    label: "You (Designer)",
    required: true,
    showBusiness: true,
  },
  {
    id: "provider_address",
    kind: "address",
    label: "Your address",
    required: true,
  },
  {
    id: "scope",
    kind: "improve-textarea",
    field_kind: "scope",
    label: "Scope of work",
    required: true,
    minRows: 6,
    placeholder: "Brand identity, web design, illustration, etc.",
    help: "Describe what you'll do. The Improve button polishes it into professional contract language.",
  },
  {
    id: "deliverables",
    kind: "improve-textarea",
    field_kind: "deliverables",
    label: "Deliverables",
    minRows: 4,
    placeholder: "Logo files, brand guidelines, source files, etc.",
    help: "What concrete outputs the client receives. Improve will format it as a numbered list.",
  },
  {
    id: "rate_type",
    kind: "select",
    label: "Rate type",
    required: true,
    help: "How you charge for this engagement. Pick one — the contract phrasing follows.",
    options: [
      { value: "hourly", label: "Hourly" },
      { value: "fixed", label: "Fixed project fee" },
      { value: "retainer", label: "Monthly retainer" },
    ],
    optionDescriptions: RATE_TYPE_OPT_DESC,
  },
  {
    id: "rate_amount",
    kind: "number",
    label: "Rate amount",
    suffix: "€",
    min: 0,
    required: true,
    dynamicHelp: (a) => {
      const amt = typeof a.rate_amount === "number" ? a.rate_amount : null;
      const rt = typeof a.rate_type === "string" ? a.rate_type : null;
      if (!amt || !rt) return null;
      const unit = RATE_TYPE_UNIT[rt] ?? "";
      return `${clientNameFor(a)} will pay you €${amt.toLocaleString("en-US")} ${unit}.`.trim();
    },
  },
  {
    id: "payment_schedule",
    kind: "select",
    label: "Payment schedule",
    required: true,
    help: "When invoices are due. Shorter schedules favor you.",
    options: [
      { value: "on_completion", label: "On completion" },
      { value: "milestones", label: "Milestones" },
      { value: "net_15", label: "Net 15" },
      { value: "net_30", label: "Net 30" },
    ],
    optionDescriptions: PAYMENT_SCHEDULE_OPT_DESC,
  },
  { id: "start_date", kind: "date", label: "Start date" },
  {
    id: "end_date",
    kind: "date",
    label: "Estimated end date",
    allowOpenEnded: true,
    openLabel: "No estimated end date",
  },
  {
    id: "revision_rounds",
    kind: "number",
    label: "Number of revision rounds",
    defaultValue: 3,
    min: 0,
  },
  {
    id: "kill_fee_pct",
    kind: "number",
    label: "Kill fee (% of total)",
    suffix: "%",
    defaultValue: 50,
    min: 0,
    max: 100,
    help: "If the Client cancels mid-project, you keep this percentage of unbilled work. Industry standard: 25–50%.",
  },
  {
    id: "ip_transfer",
    kind: "select",
    label: "IP transfer",
    required: true,
    help: "Who owns the work product once payment is made.",
    options: [
      { value: "on_full_payment", label: "On full payment" },
      { value: "on_signature", label: "On signature" },
      { value: "retained_until_paid", label: "Retained until paid" },
    ],
    optionDescriptions: IP_TRANSFER_OPT_DESC,
  },
  {
    id: "portfolio_use",
    kind: "toggle",
    label: "Designer may show work in portfolio?",
    defaultValue: true,
  },
  {
    id: "termination_notice",
    kind: "number",
    label: "Termination notice (days)",
    suffix: "days",
    defaultValue: 14,
    min: 0,
    help: "Days of written notice either party must give to end the contract. 14–30 is typical.",
  },
  {
    id: "governing_law",
    kind: "select",
    label: "Governing law (country)",
    required: true,
    help: HELP_GOVERNING_LAW,
    options: JURISDICTION_OPTIONS,
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
  client: NameSchema,
  client_address: AddressSchema,
  provider: NameSchema,
  provider_address: AddressSchema,
  scope: z.string().trim().min(1),
  deliverables: z.string().trim().optional().default(""),
  rate_type: z.enum(["hourly", "fixed", "retainer"]),
  rate_amount: z.coerce.number().min(0),
  payment_schedule: z.enum(["on_completion", "milestones", "net_15", "net_30"]),
  start_date: z.string().optional().default(""),
  end_date: z.string().optional().default(""),
  end_date_open: z.boolean().optional().default(false),
  revision_rounds: z.coerce.number().int().min(0).default(3),
  kill_fee_pct: z.coerce.number().min(0).max(100).default(50),
  ip_transfer: z.enum(["on_full_payment", "on_signature", "retained_until_paid"]),
  portfolio_use: z.coerce.boolean().default(true),
  termination_notice: z.coerce.number().int().min(0).default(14),
  governing_law: z.string().min(2),
  country_rider_on: z.boolean().optional().default(false),
});

type DesignAnswers = z.infer<typeof validator>;

function render(raw: Record<string, unknown>): string {
  const a = validator.parse(raw) as DesignAnswers;
  const clientParty = formatParty(a.client);
  const clientAddr = formatAddress(a.client_address);
  const providerParty = formatParty(a.provider);
  const providerAddr = formatAddress(a.provider_address);
  const juris = getJurisdiction(a.governing_law);

  const parties = clauses("Parties", [
    `This Design Services Agreement is between ${clientParty} ("Client"), at ${clientAddr}, and ${providerParty} ("Designer"), at ${providerAddr}.`,
  ]);

  const scope = clauses("Scope of Work", [
    `The Designer will create the following work for the Client: ${fallback(a.scope, "scope to be agreed in writing")}.`,
    `The fee includes ${fallback(a.revision_rounds, "the agreed number of")} round(s) of revisions to the deliverables. Additional revisions are billable at the Designer's standard rate.`,
    "Material changes to scope must be agreed in writing.",
  ]);

  const deliverables = clauses("Deliverables", [
    a.deliverables
      ? `The Designer will deliver: ${a.deliverables}.`
      : "Deliverables include final production-ready files in formats appropriate to the work, plus reasonable accompanying source files where agreed.",
    "Deliverables are considered accepted unless the Client provides written notice of specific issues within seven (7) days of delivery.",
  ]);

  const paymentLines: string[] = [
    `The Client will pay the Designer ${formatCurrency(a.rate_amount)} as ${RATE_TYPE_LABEL[a.rate_type] ?? "the agreed fee"}.`,
    `Payment is due ${PAYMENT_SCHEDULE_LABEL[a.payment_schedule] ?? "as agreed"}.`,
    `If the Client cancels the project after work has commenced, the Client will pay a kill fee equal to ${fallback(a.kill_fee_pct, "the agreed percentage")}% of the total project fee, in addition to any milestones already invoiced.`,
    "Late payments accrue interest at the statutory rate or 1.5% per month, whichever is lower.",
    "Fees are exclusive of applicable taxes.",
  ];
  if (a.country_rider_on && juris?.rider?.id === "vat_reverse_charge") {
    paymentLines.push(juris.rider.body);
  }
  const payment = clauses("Payment", paymentLines);

  const timeline = clauses("Timeline", [
    a.start_date
      ? `Work begins on ${formatDate(a.start_date)}.`
      : "Work begins on signature of this Agreement.",
    a.end_date_open
      ? "The engagement continues on a rolling basis until terminated by either Party in accordance with the Termination clause."
      : a.end_date
        ? `Estimated completion: ${formatDate(a.end_date)}, subject to Client feedback and approval timelines.`
        : "The Parties will agree the completion date in writing once scope is finalised.",
    "Delays caused by the Client's feedback cycle extend the timeline accordingly.",
  ]);

  const ip = clauses("Intellectual Property", [
    IP_TRANSFER_LABEL[a.ip_transfer] ?? IP_TRANSFER_LABEL.on_full_payment!,
    "Unused concepts, sketches, and rejected directions remain the Designer's property and may be used in other projects.",
    a.portfolio_use
      ? "The Designer may display the final work in their portfolio, on their website, and in case studies. The Designer will not disclose Client-confidential information without consent."
      : "The Designer may not display the work in their portfolio without the Client's prior written consent.",
  ]);

  const confidentiality = clauses("Confidentiality", [
    "Each Party will keep the other Party's non-public information confidential and use it only to perform this Agreement.",
    "Confidentiality obligations survive termination for three (3) years; trade secrets remain confidential indefinitely.",
  ]);

  const termination = clauses("Termination", [
    `Either Party may terminate this Agreement on ${fallback(a.termination_notice, "the agreed number of")} days' written notice for any reason.`,
    "Either Party may terminate immediately for material breach not cured within fourteen (14) days of written notice.",
    "On termination, the Client will pay for all work performed and any applicable kill fee.",
  ]);

  const generalLines: string[] = [
    juris
      ? juris.governing_law_sentence
      : `This Agreement is governed by the laws of ${a.governing_law}. The Parties submit to the exclusive jurisdiction of the courts of that country.`,
    "If any provision is held unenforceable, the remaining provisions remain in full force.",
    "This Agreement is the entire agreement between the Parties and supersedes prior discussions.",
    "Amendments require a writing signed (or electronically acknowledged) by both Parties.",
  ];
  if (
    a.country_rider_on &&
    juris?.rider &&
    juris.rider.id !== "vat_reverse_charge"
  ) {
    generalLines.push(juris.rider.body);
  }
  const general = clauses("General", generalLines);

  const signatures = clauses("Signatures", [
    "**Client:** ____________________________   Date: ____________",
    "**Designer:** ____________________________   Date: ____________",
  ]);

  return [
    `# Design Services Agreement`,
    `*Between ${clientParty} and ${providerParty}*`,
    parties,
    scope,
    deliverables,
    payment,
    timeline,
    ip,
    confidentiality,
    termination,
    general,
    signatures,
    FOOTER(),
  ].join("\n\n");
}

function buildTitle(raw: Record<string, unknown>): string {
  const parsed = validator.safeParse(raw);
  if (!parsed.success) return "Design Services Agreement";
  const c = formatParty(parsed.data.client);
  const p = formatParty(parsed.data.provider);
  return `Design Agreement — ${c} & ${p}`;
}

export const design: IndustrySchema = {
  id: "design",
  label: "Design / Creative",
  description: "Brand, graphic, web, or illustration work.",
  questions: designQuestions,
  validator,
  render,
  buildTitle,
};
