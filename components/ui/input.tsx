import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-12 w-full rounded-[2px] border border-border-glass bg-[var(--surface)] px-4 text-sm text-text-primary placeholder:text-text-secondary backdrop-blur-md transition-colors focus:border-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-32 w-full rounded-[2px] border border-border-glass bg-[var(--surface)] px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary backdrop-blur-md transition-colors focus:border-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
