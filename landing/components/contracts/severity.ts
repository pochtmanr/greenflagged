import type { VerdictSeverity } from "@/lib/supabase/types";

export const SEVERITY_LABEL: Record<VerdictSeverity, string> = {
  green: "GREEN FLAGGED",
  yellow: "MINOR ISSUES",
  orange: "RED FLAGS",
  red: "DO NOT SIGN",
};

export const SEVERITY_SHORT: Record<VerdictSeverity, string> = {
  green: "OK",
  yellow: "WARN",
  orange: "HIGH",
  red: "CRITICAL",
};

export const TAXONOMY_LABELS: Record<string, string> = {
  ip_ownership: "IP ownership",
  payment_terms: "Payment terms",
  termination: "Termination",
  nda_scope: "NDA scope",
  liability_cap: "Liability cap",
  jurisdiction: "Jurisdiction",
  auto_renewal: "Auto-renewal",
  kill_fees: "Kill fees",
  exclusivity: "Exclusivity",
};
