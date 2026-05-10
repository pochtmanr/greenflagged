import * as React from "react";
import { cn } from "@/lib/cn";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article" | "aside";
  padded?: "sm" | "md" | "lg";
  strong?: boolean;
};

export function GlassCard({
  className,
  children,
  as: Tag = "div",
  padded = "md",
  strong = false,
  ...props
}: GlassCardProps) {
  const padding = padded === "sm" ? "p-4" : padded === "lg" ? "p-8" : "p-6";
  return (
    <Tag
      className={cn(
        strong ? "glass-strong" : "glass-card",
        padding,
        "flex flex-col",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
