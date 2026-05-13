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

const IP_TRANSFER_LABEL: Record<string, string> = {
  on_full_payment:
    "All rights in the final deliverables transfer to the Client upon receipt of full payment. Until full payment, the Provider retains all rights.",
  on_signature:
    "All rights in the final deliverables transfer to the Client upon signature of this Agreement, regardless of payment status.",
  retained_until_paid:
    "The Provider retains all rights in the deliverables. The Client receives a worldwide, non-exclusive licence to use them once full payment is made.",
};

export const designQuestions: Question[] = [
  { id: "client_name", kind: "text", label: "Client legal name", required: true },
  { id: "client_address", kind: "text", label: "Client address", multiline: true },
  {
    id: "provider_name",
    kind: "text",
    label: "Your legal name (Designer)",
    required: true,
  },
  { id: "provider_address", kind: "text", label: "Your address", multiline: true },
  {
    id: "scope",
    kind: "text",
    label: "Scope of work",
    multiline: true,
    required: true,
    placeholder: "Brand identity, web design, illustration, etc.",
  },
  {
    id: "deliverables",
    kind: "text",
    label: "Deliverables",
    multiline: true,
    placeholder: "Logo files, brand guidelines, source files, etc.",
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
  { id: "rate_amount", kind: "number", label: "Rate amount", suffix: "€", min: 0, required: true },
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
  },
  {
    id: "ip_transfer",
    kind: "select",
    label: "IP transfer",
    required: true,
    options: [
      { value: "on_full_payment", label: "On full payment" },
      { value: "on_signature", label: "On signature" },
      { value: "retained_until_paid", label: "Retained until paid" },
    ],
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
  client_name: z.string().trim().min(1),
  client_address: z.string().trim().optional().default(""),
  provider_name: z.string().trim().min(1),
  provider_address: z.string().trim().optional().default(""),
  scope: z.string().trim().min(1),
  deliverables: z.string().trim().optional().default(""),
  rate_type: z.enum(["hourly", "fixed", "retainer"]),
  rate_amount: z.coerce.number().min(0),
  payment_schedule: z.enum(["on_completion", "milestones", "net_15", "net_30"]),
  start_date: z.string().optional().default(""),
  end_date: z.string().optional().default(""),
  revision_rounds: z.coerce.number().int().min(0).default(3),
  kill_fee_pct: z.coerce.number().min(0).max(100).default(50),
  ip_transfer: z.enum(["on_full_payment", "on_signature", "retained_until_paid"]),
  portfolio_use: z.coerce.boolean().default(true),
  termination_notice: z.coerce.number().int().min(0).default(14),
  governing_law: z.string().min(2),
});

type DesignAnswers = z.infer<typeof validator>;

function render(raw: Record<string, unknown>): string {
  const a = validator.parse(raw) as DesignAnswers;

  const parties = clauses("Parties", [
    `This Design Services Agreement is between ${fallback(a.client_name, "Client legal name to be inserted")} ("Client"), at ${fallback(a.client_address, "Client address to be inserted")}, and ${fallback(a.provider_name, "Designer legal name to be inserted")} ("Designer"), at ${fallback(a.provider_address, "Designer address to be inserted")}.`,
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

  const payment = clauses("Payment", [
    `The Client will pay the Designer ${formatCurrency(a.rate_amount)} as ${RATE_TYPE_LABEL[a.rate_type] ?? "the agreed fee"}.`,
    `Payment is due ${PAYMENT_SCHEDULE_LABEL[a.payment_schedule] ?? "as agreed"}.`,
    `If the Client cancels the project after work has commenced, the Client will pay a kill fee equal to ${fallback(a.kill_fee_pct, "the agreed percentage")}% of the total project fee, in addition to any milestones already invoiced.`,
    "Late payments accrue interest at the statutory rate or 1.5% per month, whichever is lower.",
    "Fees are exclusive of applicable taxes.",
  ]);

  const timeline = clauses("Timeline", [
    a.start_date
      ? `Work begins on ${formatDate(a.start_date)}.`
      : "Work begins on signature of this Agreement.",
    a.end_date
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

  const general = clauses("General", [
    `This Agreement is governed by the laws of ${formatCountry(a.governing_law)}. The Parties submit to the exclusive jurisdiction of the courts of that country.`,
    "If any provision is held unenforceable, the remaining provisions remain in full force.",
    "This Agreement is the entire agreement between the Parties and supersedes prior discussions.",
    "Amendments require a writing signed (or electronically acknowledged) by both Parties.",
  ]);

  const signatures = clauses("Signatures", [
    "**Client:** ____________________________   Date: ____________",
    "**Designer:** ____________________________   Date: ____________",
  ]);

  return [
    `# Design Services Agreement`,
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
  if (!parsed.success) return "Design Services Agreement";
  return `Design Agreement — ${parsed.data.client_name} & ${parsed.data.provider_name}`;
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
