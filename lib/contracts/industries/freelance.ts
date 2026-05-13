import { z } from "zod";
import { COUNTRIES } from "@/lib/countries";
import type { IndustrySchema, Question } from "../types";
import {
  FOOTER,
  clauses,
  fallback,
  formatCountry,
  formatCurrency,
  formatDate,
} from "../format";

const RATE_TYPE_LABEL: Record<string, string> = {
  hourly: "an hourly rate",
  fixed: "a fixed project fee",
  retainer: "a monthly retainer",
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
  shared:
    "The Provider and Client jointly own the intellectual property in the deliverables, with each party free to use and exploit the work without further accounting.",
};

export const freelanceQuestions: Question[] = [
  {
    id: "client_name",
    kind: "text",
    label: "Client legal name",
    placeholder: "e.g. Acme GmbH",
    required: true,
  },
  {
    id: "client_address",
    kind: "text",
    label: "Client address",
    multiline: true,
    placeholder: "Street, city, country",
  },
  {
    id: "provider_name",
    kind: "text",
    label: "Your legal name",
    placeholder: "e.g. Roman Pochtman",
    required: true,
  },
  {
    id: "provider_address",
    kind: "text",
    label: "Your address",
    multiline: true,
  },
  {
    id: "scope",
    kind: "text",
    label: "Scope of work",
    multiline: true,
    required: true,
    placeholder: "What you'll deliver, in plain language",
  },
  {
    id: "deliverables",
    kind: "text",
    label: "Deliverables",
    multiline: true,
    placeholder: "Specific outputs the Client will receive",
  },
  {
    id: "rate_type",
    kind: "select",
    label: "Rate type",
    required: true,
    options: [
      { value: "hourly", label: "Hourly" },
      { value: "fixed", label: "Fixed project fee" },
      { value: "retainer", label: "Monthly retainer" },
    ],
  },
  {
    id: "rate_amount",
    kind: "number",
    label: "Rate amount",
    suffix: "€",
    min: 0,
    required: true,
  },
  {
    id: "payment_schedule",
    kind: "select",
    label: "Payment schedule",
    required: true,
    options: [
      { value: "on_completion", label: "On completion" },
      { value: "milestones", label: "Milestones" },
      { value: "net_15", label: "Net 15" },
      { value: "net_30", label: "Net 30" },
    ],
  },
  { id: "start_date", kind: "date", label: "Start date" },
  { id: "end_date", kind: "date", label: "Estimated end date" },
  {
    id: "ip_ownership",
    kind: "select",
    label: "IP ownership",
    required: true,
    options: [
      { value: "client_on_payment", label: "Client owns on full payment" },
      { value: "provider_retains", label: "Provider retains; Client licenses" },
      { value: "shared", label: "Shared" },
    ],
  },
  {
    id: "termination_notice",
    kind: "number",
    label: "Termination notice (days)",
    suffix: "days",
    defaultValue: 14,
    min: 0,
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
  client_name: z.string().trim().min(1, "Client name is required"),
  client_address: z.string().trim().optional().default(""),
  provider_name: z.string().trim().min(1, "Provider name is required"),
  provider_address: z.string().trim().optional().default(""),
  scope: z.string().trim().min(1, "Scope is required"),
  deliverables: z.string().trim().optional().default(""),
  rate_type: z.enum(["hourly", "fixed", "retainer"]),
  rate_amount: z.coerce.number().min(0),
  payment_schedule: z.enum(["on_completion", "milestones", "net_15", "net_30"]),
  start_date: z.string().optional().default(""),
  end_date: z.string().optional().default(""),
  ip_ownership: z.enum(["client_on_payment", "provider_retains", "shared"]),
  termination_notice: z.coerce.number().int().min(0).default(14),
  governing_law: z.string().min(2),
});

type FreelanceAnswers = z.infer<typeof validator>;

function render(raw: Record<string, unknown>): string {
  const a = validator.parse(raw) as FreelanceAnswers;

  const parties = clauses("Parties", [
    `This Agreement is entered into between ${fallback(
      a.client_name,
      "Client legal name to be inserted"
    )} ("Client"), with its address at ${fallback(
      a.client_address,
      "Client address to be inserted"
    )}, and ${fallback(a.provider_name, "Provider legal name to be inserted")} ("Provider"), with its address at ${fallback(a.provider_address, "Provider address to be inserted")}.`,
    "Each of the Client and the Provider is a 'Party' and together the 'Parties'.",
  ]);

  const scope = clauses("Scope of Work", [
    `The Provider will perform the following work for the Client: ${fallback(
      a.scope,
      "scope of work to be agreed in writing"
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

  const payment = clauses("Payment", [
    `The Client will pay the Provider ${formatCurrency(a.rate_amount)} as ${
      RATE_TYPE_LABEL[a.rate_type] ?? "the agreed fee"
    }.`,
    `Payment is due ${PAYMENT_SCHEDULE_LABEL[a.payment_schedule] ?? "in accordance with the agreed schedule"}.`,
    "Late payments accrue interest at the statutory rate or 1.5% per month, whichever is lower.",
    "All fees are exclusive of applicable taxes, which the Client is responsible for.",
  ]);

  const timeline = clauses("Timeline", [
    a.start_date
      ? `Work will begin on ${formatDate(a.start_date)}.`
      : "Work will begin on the date this Agreement is signed by both Parties.",
    a.end_date
      ? `The Parties estimate the work will be completed by ${formatDate(a.end_date)}, subject to Client cooperation and timely feedback.`
      : "The Parties will agree the completion date in writing once scope is finalised.",
  ]);

  const ip = clauses("Intellectual Property & Ownership", [
    IP_LABEL[a.ip_ownership] ?? IP_LABEL.client_on_payment!,
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
      "the agreed number of"
    )} days' written notice for any reason.`,
    "Either Party may terminate immediately for material breach not cured within fourteen (14) days of written notice.",
    "On termination, the Client will pay for all work performed up to the termination date.",
  ]);

  const general = clauses("General", [
    `This Agreement is governed by the laws of ${formatCountry(a.governing_law)} without reference to its conflict-of-laws rules. The Parties submit to the exclusive jurisdiction of the courts of that country.`,
    "If any provision of this Agreement is held unenforceable, the remaining provisions remain in full force.",
    "This Agreement is the entire agreement between the Parties on its subject matter and supersedes all prior discussions.",
    "Amendments require a writing signed (or electronically acknowledged) by both Parties.",
  ]);

  const signatures = clauses("Signatures", [
    "**Client:** ____________________________   Date: ____________",
    "**Provider:** ____________________________   Date: ____________",
  ]);

  return [
    `# Freelance Services Agreement`,
    `*Between ${a.client_name} and ${a.provider_name}*`,
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
  return `Freelance Agreement — ${parsed.data.client_name} & ${parsed.data.provider_name}`;
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
