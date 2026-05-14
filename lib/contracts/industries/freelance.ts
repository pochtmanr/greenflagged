import { z } from "zod";
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
import {
  JURISDICTION_OPTIONS,
  getJurisdiction,
} from "../jurisdictions";

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

const IP_LABEL: Record<string, string> = {
  client_on_payment:
    "Upon receipt of full payment, all rights, title, and interest in the deliverables transfer to the Client. Until full payment, the Provider retains all rights.",
  provider_retains:
    "The Provider retains all intellectual property in the deliverables. The Client receives a worldwide, non-exclusive license to use the deliverables for their stated business purpose.",
};

const RATE_TYPE_OPT_DESC: Record<string, string> = {
  hourly:
    "You bill for hours worked. Best for ongoing maintenance or unscoped work.",
  fixed:
    "One total price for a defined deliverable. Best when scope is clear.",
  retainer:
    "A recurring monthly amount for ongoing availability or work. Best for long engagements.",
};

const PAYMENT_SCHEDULE_OPT_DESC: Record<string, string> = {
  on_completion: "Invoice is due when the work is delivered.",
  milestones: "Invoices follow named milestones in the scope.",
  net_15: "Invoices are due 15 days after issue.",
  net_30: "Invoices are due 30 days after issue.",
};

const IP_OPT_DESC: Record<string, string> = {
  client_on_payment:
    "All rights transfer to the Client once you've been paid in full.",
  provider_retains:
    "You keep the rights and grant the Client a license to use the work.",
  shared:
    "Ownership is split between named parties by the percentages you set below.",
};

const HELP_RATE_TYPE =
  "How you charge for this engagement. Pick one — the contract phrasing follows.";
const HELP_PAYMENT_SCHEDULE =
  "When invoices are due. Shorter schedules favor you (the Provider).";
const HELP_IP =
  "Who owns the work product. The freelance norm is 'Client owns on full payment' — you keep rights until the invoice clears.";
const HELP_TERMINATION =
  "How many days' written notice either party must give to end the contract. 14–30 days is typical.";
const HELP_GOVERNING_LAW =
  "The legal system that interprets this contract. Pick where you (the Provider) are based — easier and cheaper to enforce locally.";

function clientNameFor(answers: Record<string, unknown>): string {
  const client = answers.client as
    | { first?: string; family?: string; business?: string }
    | undefined;
  if (!client) return "The Client";
  const business = client.business?.trim();
  if (business) return business;
  const personal = [client.first, client.family]
    .filter(Boolean)
    .join(" ")
    .trim();
  return personal || "The Client";
}

export const freelanceQuestions: Question[] = [
  {
    id: "client",
    kind: "name-group",
    label: "Client",
    required: true,
    showBusiness: true,
    help: "The person or company you're working for. Add the business name if you're contracting with a company.",
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
    label: "You (Provider)",
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
    placeholder: "What you'll deliver, in plain language",
    help: "Describe what you'll do. The Improve button polishes it into professional contract language.",
  },
  {
    id: "deliverables",
    kind: "improve-textarea",
    field_kind: "deliverables",
    label: "Deliverables",
    minRows: 4,
    placeholder: "Specific outputs the Client will receive",
    help: "What concrete outputs the client receives. Improve will format it as a numbered list.",
  },
  {
    id: "rate_type",
    kind: "select",
    label: "Rate type",
    required: true,
    help: HELP_RATE_TYPE,
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
      const who = clientNameFor(a);
      return `${who} will pay you €${amt.toLocaleString("en-US")} ${unit}.`.trim();
    },
  },
  {
    id: "payment_schedule",
    kind: "select",
    label: "Payment schedule",
    required: true,
    help: HELP_PAYMENT_SCHEDULE,
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
    id: "ip_ownership",
    kind: "select",
    label: "IP ownership",
    required: true,
    help: HELP_IP,
    options: [
      { value: "client_on_payment", label: "Client owns on full payment" },
      { value: "provider_retains", label: "Provider retains; Client licenses" },
      { value: "shared", label: "Shared" },
    ],
    optionDescriptions: IP_OPT_DESC,
  },
  {
    id: "termination_notice",
    kind: "number",
    label: "Termination notice (days)",
    suffix: "days",
    defaultValue: 14,
    min: 0,
    help: HELP_TERMINATION,
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
  first: z.string().trim().min(1, "First name is required"),
  family: z.string().trim().min(1, "Family name is required"),
  business: z.string().trim().optional().default(""),
});

const AddressSchema = z.object({
  country: z.string().min(2, "Country is required"),
  city: z.string().trim().min(1, "City is required"),
  street: z.string().trim().min(1, "Street is required"),
  postal: z.string().trim().min(1, "Postal code is required"),
});

const IpSharedSchema = z.object({
  provider_pct: z.coerce.number().int().min(0).max(100),
  client_pct: z.coerce.number().int().min(0).max(100),
  additional: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Each party needs a name"),
        pct: z.coerce.number().int().min(0).max(100),
      }),
    )
    .default([]),
});

const validator = z.object({
  client: NameSchema,
  client_address: AddressSchema,
  provider: NameSchema,
  provider_address: AddressSchema,
  scope: z.string().trim().min(1, "Scope is required"),
  deliverables: z.string().trim().optional().default(""),
  rate_type: z.enum(["hourly", "fixed", "retainer"]),
  rate_amount: z.coerce.number().min(0),
  payment_schedule: z.enum(["on_completion", "milestones", "net_15", "net_30"]),
  start_date: z.string().optional().default(""),
  end_date: z.string().optional().default(""),
  end_date_open: z.boolean().optional().default(false),
  ip_ownership: z.enum(["client_on_payment", "provider_retains", "shared"]),
  ip_shared: IpSharedSchema.optional(),
  termination_notice: z.coerce.number().int().min(0).default(14),
  governing_law: z.string().min(2),
  country_rider_on: z.boolean().optional().default(false),
});

type FreelanceAnswers = z.infer<typeof validator>;

function formatPctList(answers: FreelanceAnswers): string {
  const s = answers.ip_shared;
  if (!s) return "the Provider and the Client in equal shares";
  const parts: string[] = [
    `the Provider (${s.provider_pct}%)`,
    `the Client (${s.client_pct}%)`,
    ...s.additional
      .filter((p) => p.name.trim())
      .map((p) => `${p.name.trim()} (${p.pct}%)`),
  ];
  return parts.join(", ");
}

function ipClauseBody(answers: FreelanceAnswers): string {
  if (answers.ip_ownership === "shared") {
    return `The intellectual property in the deliverables is jointly owned by ${formatPctList(
      answers,
    )}. Each owner may use and exploit the work without further accounting, except as the Parties otherwise agree in writing.`;
  }
  return IP_LABEL[answers.ip_ownership] ?? IP_LABEL.client_on_payment!;
}

function render(raw: Record<string, unknown>): string {
  const a = validator.parse(raw) as FreelanceAnswers;
  const clientParty = formatParty(a.client);
  const clientAddr = formatAddress(a.client_address);
  const providerParty = formatParty(a.provider);
  const providerAddr = formatAddress(a.provider_address);

  const parties = clauses("Parties", [
    `This Agreement is entered into between ${clientParty} ("Client"), with its address at ${clientAddr}, and ${providerParty} ("Provider"), with its address at ${providerAddr}.`,
    "Each of the Client and the Provider is a 'Party' and together the 'Parties'.",
  ]);

  const scope = clauses("Scope of Work", [
    `The Provider will perform the following work for the Client: ${fallback(
      a.scope,
      "scope of work to be agreed in writing",
    )}.`,
    "The Provider will perform the work with reasonable professional skill and care, in accordance with industry norms.",
    "Any change in scope must be agreed in writing (email is sufficient) and may affect fees and timeline.",
  ]);

  const deliverables = clauses("Deliverables", [
    a.deliverables
      ? `The Provider will deliver to the Client: ${a.deliverables}.`
      : "The deliverables are described in the Scope of Work above. Any additional deliverables must be agreed in writing.",
    "Deliverables are considered accepted unless the Client provides written notice of specific defects within seven (7) days of delivery.",
  ]);

  const juris = getJurisdiction(a.governing_law);

  const paymentLines: string[] = [
    `The Client will pay the Provider ${formatCurrency(a.rate_amount)} as ${
      RATE_TYPE_LABEL[a.rate_type] ?? "the agreed fee"
    }.`,
    `Payment is due ${PAYMENT_SCHEDULE_LABEL[a.payment_schedule] ?? "in accordance with the agreed schedule"}.`,
    "Late payments accrue interest at the statutory rate or 1.5% per month, whichever is lower.",
    "All fees are exclusive of applicable taxes, which the Client is responsible for.",
  ];
  if (
    a.country_rider_on &&
    juris?.code === "EU" &&
    juris.rider?.id === "vat_reverse_charge"
  ) {
    paymentLines.push(juris.rider.body);
  }
  const payment = clauses("Payment", paymentLines);

  const timeline = clauses("Timeline", [
    a.start_date
      ? `Work will begin on ${formatDate(a.start_date)}.`
      : "Work will begin on the date this Agreement is signed by both Parties.",
    a.end_date_open
      ? "The engagement continues on a rolling basis until terminated by either Party in accordance with the Termination clause."
      : a.end_date
        ? `The Parties estimate the work will be completed by ${formatDate(a.end_date)}, subject to Client cooperation and timely feedback.`
        : "The Parties will agree the completion date in writing once scope is finalised.",
  ]);

  const ip = clauses("Intellectual Property & Ownership", [
    ipClauseBody(a),
    "The Provider retains the right to display non-confidential aspects of the work in their portfolio unless the Client objects in writing.",
    "Pre-existing tools, libraries, and know-how owned by the Provider remain the Provider's property; the Client receives a perpetual licence to use them as embedded in the deliverables.",
  ]);

  const confidentiality = clauses("Confidentiality", [
    "Each Party will keep the other Party's non-public information confidential and use it only to perform this Agreement.",
    "Confidentiality obligations survive termination for three (3) years, except that trade secrets remain confidential indefinitely.",
    "This clause does not restrict information that is publicly available, independently developed, or required to be disclosed by law.",
  ]);

  const termination = clauses("Termination", [
    `Either Party may terminate this Agreement on ${fallback(
      a.termination_notice,
      "the agreed number of",
    )} days' written notice for any reason.`,
    "Either Party may terminate immediately for material breach not cured within fourteen (14) days of written notice.",
    "On termination, the Client will pay for all work performed up to the termination date.",
  ]);

  // Governing-law sentence comes from the per-country shortlist when we have
  // one; falls back to a generic phrasing otherwise.
  const generalLines: string[] = [
    juris
      ? juris.governing_law_sentence
      : `This Agreement is governed by the laws of ${a.governing_law} without reference to its conflict-of-laws rules. The Parties submit to the exclusive jurisdiction of the courts of that country.`,
    "If any provision of this Agreement is held unenforceable, the remaining provisions remain in full force.",
    "This Agreement is the entire agreement between the Parties on its subject matter and supersedes all prior discussions.",
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
    "**Provider:** ____________________________   Date: ____________",
  ]);

  return [
    `# Freelance Services Agreement`,
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
  if (!parsed.success) return "Freelance Services Agreement";
  const c = formatParty(parsed.data.client);
  const p = formatParty(parsed.data.provider);
  return `Freelance Agreement — ${c} & ${p}`;
}

export const freelance: IndustrySchema = {
  id: "freelance",
  label: "Freelance",
  description: "Services contract for solo freelancers and small studios.",
  questions: freelanceQuestions,
  validator,
  render,
  buildTitle,
};
