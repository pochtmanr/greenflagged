import {
  Banknote,
  ScrollText,
  Fingerprint,
  ShieldOff,
  AlertOctagon,
  DoorClosed,
  Gavel,
  FilePen,
  type LucideIcon,
} from "lucide-react";

export type ClauseCategory = {
  id: string;
  title: string;
  icon: LucideIcon;
  example: string;
};

export const CATEGORIES: ClauseCategory[] = [
  {
    id: "payment",
    title: "Payment",
    icon: Banknote,
    example:
      "Net-90 with no late fee, paid only on client's acceptance — money sits with them for months.",
  },
  {
    id: "scope",
    title: "Scope",
    icon: ScrollText,
    example:
      "\"Reasonable revisions\" with no cap. Unbounded scope = unbounded unpaid work.",
  },
  {
    id: "ip",
    title: "IP transfer",
    icon: Fingerprint,
    example:
      "All your prior work and tools become the client's property the moment you deliver.",
  },
  {
    id: "restrictions",
    title: "Restrictions",
    icon: ShieldOff,
    example:
      "12-month non-compete covering an entire industry — likely unenforceable but a leverage tool.",
  },
  {
    id: "liability",
    title: "Liability",
    icon: AlertOctagon,
    example:
      "Uncapped indemnification for any third-party claim, including ones outside your control.",
  },
  {
    id: "termination",
    title: "Termination",
    icon: DoorClosed,
    example:
      "Client can terminate \"for convenience\" with 7 days' notice; you owe a 30-day notice penalty.",
  },
  {
    id: "dispute",
    title: "Dispute resolution",
    icon: Gavel,
    example:
      "Mandatory arbitration in a jurisdiction 4,000 miles away, with their choice of arbitrator.",
  },
  {
    id: "amendments",
    title: "Amendments",
    icon: FilePen,
    example:
      "\"Schedule may be amended in writing by Client\" — they can rewrite the deal unilaterally.",
  },
];
