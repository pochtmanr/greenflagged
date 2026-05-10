import * as React from "react";
import { cn } from "@/lib/cn";

export type Severity = "green" | "yellow" | "orange" | "red";

const styles: Record<Severity, string> = {
  green:
    "bg-green-500/15 text-green-300 border-green-300/40 shadow-[0_0_24px_-12px_var(--severity-green)]",
  yellow:
    "bg-[var(--severity-yellow)]/10 text-[var(--severity-yellow)] border-[var(--severity-yellow)]/40",
  orange:
    "bg-[var(--severity-orange)]/10 text-[var(--severity-orange)] border-[var(--severity-orange)]/40",
  red: "bg-[var(--severity-red)]/10 text-[var(--severity-red)] border-[var(--severity-red)]/40",
};

const labels: Record<Severity, string> = {
  green: "Green-flagged",
  yellow: "Note",
  orange: "Warning",
  red: "Red flag",
};

type VerdictBadgeProps = {
  severity: Severity;
  children?: React.ReactNode;
  className?: string;
};

export function VerdictBadge({
  severity,
  children,
  className,
}: VerdictBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3px]",
        styles[severity],
        className,
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ background: `var(--severity-${severity})` }}
      />
      {children ?? labels[severity]}
    </span>
  );
}
