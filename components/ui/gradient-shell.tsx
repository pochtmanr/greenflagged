import * as React from "react";
import { cn } from "@/lib/cn";

type GradientShellProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Outer hairline frame per design.md "gradient border shell" technique.
 * Wraps a content surface with an 8px-tiled diagonal gradient so the edge
 * reads as premium depth instead of a flat stroke.
 */
export function GradientShell({
  className,
  children,
  ...props
}: GradientShellProps) {
  return (
    <div className={cn("gradient-shell", className)} {...props}>
      {children}
    </div>
  );
}
