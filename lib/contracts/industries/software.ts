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

const INDEMNITY_LABEL: Record<string, string> = {
  "1x": "one (1) times the fees paid by the Client in the twelve (12) months preceding the claim",
  "2x": "two (2) times the fees paid by the Client in the twelve (12) months preceding the claim",
  uncapped: "uncapped (each Party retains full liability under applicable law)",
};

export const softwareQuestions: Question[] = [
  {
    id: "client_name",
    kind: "text",
    label: "Client legal name",
    required: true,
  },
  { id: "client_address", kind: "text", label: "Client address", multiline: true },
  {
    id: "provider_name",
    kind: "text",
    label: "Your legal name (Provider)",
    required: true,
  },
  { id: "provider_address", kind: "text", label: "Your address", multiline: true },
  {
    id: "scope",
    kind: "text",
    label: "Scope of work",
    multiline: true,
    required: true,
    placeholder: "What software you will design, build, or maintain",
  },
  {
    id: "deliverables",
    kind: "text",
    label: "Deliverables",
    multiline: true,
    placeholder: "Source code, docs, environments, etc.",
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
    id: "warranty_days",
    kind: "number",
    label: "Warranty period (days)",
    suffix: "days",
    defaultValue: 30,
    min: 0,
  },
  {
    id: "ip_assignment",
    kind: "toggle",
    label: "Full IP assignment on payment? (off = perpetual licence)",
    defaultValue: true,
  },
  {
    id: "oss_ack",
    kind: "toggle",
    label: "Acknowledge use of open-source components?",
    defaultValue: true,
  },
  {
    id: "indemnity_cap",
    kind: "select",
    label: "Indemnity cap",
    required: true,
    options: [
      { value: "1x", label: "1× fees paid" },
      { value: "2x", label: "2× fees paid" },
      { value: "uncapped", label: "Uncapped" },
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
  warranty_days: z.coerce.number().int().min(0).default(30),
  ip_assignment: z.coerce.boolean().default(true),
  oss_ack: z.coerce.boolean().default(true),
  indemnity_cap: z.enum(["1x", "2x", "uncapped"]),
  termination_notice: z.coerce.number().int().min(0).default(14),
  governing_law: z.string().min(2),
});

type SoftwareAnswers = z.infer<typeof validator>;

function render(raw: Record<string, unknown>): string {
  const a = validator.parse(raw) as SoftwareAnswers;

  const parties = clauses("Parties", [
    `This Software Services Agreement is entered into between ${fallback(
      a.client_name,
      "Client legal name to be inserted"
    )} ("Client"), at ${fallback(a.client_address, "Client address to be inserted")}, and ${fallback(a.provider_name, "Provider legal name to be inserted")} ("Provider"), at ${fallback(a.provider_address, "Provider address to be inserted")}.`,
  ]);

  const scope = clauses("Scope of Work", [
    `The Provider will design, build, and/or maintain software for the Client as follows: ${fallback(
      a.scope,
      "scope to be agreed in writing"
    )}.`,
    "Work will be performed using reasonable professional skill, current industry standards, and security best practices appropriate to the engagement.",
    "Material changes to scope must be agreed in writing and may affect fees and timeline.",
  ]);

  const deliverables = clauses("Deliverables", [
    a.deliverables
      ? `The Provider will deliver: ${a.deliverables}.`
      : "Deliverables include source code, working environments, and reasonable accompanying documentation as agreed in the Scope of Work.",
    "Source code will be delivered via the Client's repository or another method agreed in writing.",
    "Deliverables are considered accepted unless the Client provides written notice of specific defects within fourteen (14) days of delivery.",
  ]);

  const payment = clauses("Payment", [
    `The Client will pay the Provider ${formatCurrency(a.rate_amount)} as ${
      RATE_TYPE_LABEL[a.rate_type] ?? "the agreed fee"
    }.`,
    `Payment is due ${PAYMENT_SCHEDULE_LABEL[a.payment_schedule] ?? "as agreed"}.`,
    "Late payments accrue interest at the statutory rate or 1.5% per month, whichever is lower.",
    "Fees are exclusive of applicable taxes, which the Client is responsible for.",
  ]);

  const timeline = clauses("Timeline", [
    a.start_date
      ? `Work begins on ${formatDate(a.start_date)}.`
      : "Work begins on signature of this Agreement by both Parties.",
    a.end_date
      ? `Estimated completion: ${formatDate(a.end_date)}, subject to Client cooperation and timely feedback.`
      : "The completion date will be agreed in writing after scope is finalised.",
  ]);

  const ipText = a.ip_assignment
    ? "On receipt of full payment for the work to which they relate, the Provider assigns to the Client all rights, title, and interest in the deliverables, including source code, designs, and documentation."
    : "The Provider retains ownership of the deliverables and grants the Client a perpetual, worldwide, non-exclusive licence to use, modify, and distribute the deliverables for the Client's business purposes.";

  const ip = clauses("Intellectual Property", [
    ipText,
    "Pre-existing tools, libraries, frameworks, and know-how owned by the Provider remain the Provider's property; the Client receives a perpetual licence to use them as embedded in the deliverables.",
    a.oss_ack
      ? "The Provider may incorporate open-source components subject to their respective licences. On request, the Provider will provide a list of such components and their licences."
      : "The Provider will not incorporate open-source components without the Client's prior written consent.",
  ]);

  const warranty = clauses("Warranty", [
    `For ${fallback(a.warranty_days, "the warranty period in")} days after delivery, the Provider will, at no additional cost, fix material defects in the deliverables that prevent them from meeting the agreed specifications.`,
    "Outside the warranty period, defect fixes are billable at the Provider's standard rate.",
    "Except as set out above, the deliverables are provided on an 'as is' basis to the maximum extent permitted by law.",
  ]);

  const confidentiality = clauses("Confidentiality", [
    "Each Party will keep the other Party's non-public information confidential and use it only to perform this Agreement.",
    "Confidentiality obligations survive termination for three (3) years; trade secrets remain confidential indefinitely.",
    "This clause does not restrict information that is public, independently developed, or required to be disclosed by law.",
  ]);

  const liability = clauses("Liability & Indemnity", [
    `Each Party's aggregate liability arising out of this Agreement is capped at ${INDEMNITY_LABEL[a.indemnity_cap] ?? INDEMNITY_LABEL["1x"]!}.`,
    "Neither Party is liable for indirect, incidental, or consequential damages, including loss of profits, revenue, or data.",
    "The above limitations do not apply to fraud, wilful misconduct, or liability that cannot be excluded by law.",
  ]);

  const termination = clauses("Termination", [
    `Either Party may terminate this Agreement on ${fallback(
      a.termination_notice,
      "the agreed number of"
    )} days' written notice for any reason.`,
    "Either Party may terminate immediately for material breach not cured within fourteen (14) days of written notice.",
    "On termination, the Client will pay for all work performed up to the termination date and the Provider will deliver work-in-progress in its current state.",
  ]);

  const general = clauses("General", [
    `This Agreement is governed by the laws of ${formatCountry(a.governing_law)} without reference to its conflict-of-laws rules. The Parties submit to the exclusive jurisdiction of the courts of that country.`,
    "If any provision is held unenforceable, the remaining provisions remain in full force.",
    "This Agreement is the entire agreement on its subject matter and supersedes prior discussions.",
    "Amendments require a writing signed (or electronically acknowledged) by both Parties.",
  ]);

  const signatures = clauses("Signatures", [
    "**Client:** ____________________________   Date: ____________",
    "**Provider:** ____________________________   Date: ____________",
  ]);

  return [
    `# Software Services Agreement`,
    `*Between ${a.client_name} and ${a.provider_name}*`,
    parties,
    scope,
    deliverables,
    payment,
    timeline,
    ip,
    warranty,
    confidentiality,
    liability,
    termination,
    general,
    signatures,
    FOOTER(),
  ].join("\n\n");
}

function buildTitle(raw: Record<string, unknown>): string {
  const parsed = validator.safeParse(raw);
  if (!parsed.success) return "Software Services Agreement";
  return `Software Agreement — ${parsed.data.client_name} & ${parsed.data.provider_name}`;
}

export const software: IndustrySchema = {
  id: "software",
  label: "Software / IT",
  description: "Build, integrate, or maintain software for a client.",
  questions: softwareQuestions,
  validator,
  render,
  buildTitle,
};
