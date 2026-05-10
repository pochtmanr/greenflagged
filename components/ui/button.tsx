import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button — per docs/buttons.md spec.
 *
 * All buttons are text-only:
 *   • 0px border-radius
 *   • 0px padding
 *   • no border
 *   • no background fill
 *   • no shadow
 *
 * Hierarchy comes from typography + color, not from button shape.
 *
 *   size="sm"  → 12 / 500 / 16 / 0.3px / UPPER   (Item 1, 3)
 *   size="md"  → 12 / 600 / 16 / 0.3px / UPPER   (Item 4, 5 — slightly bolder)
 *   size="lg"  → 16 / 600 / 24 / -0.04em / UPPER (Item 2 — prominent CTA)
 *
 *   variant="light" → #F2F0EC text, hover → green-300         (dark surfaces)
 *   variant="dark"  → #0A0A0A text, hover → green-700         (light/flooded surfaces)
 *   variant="muted" → text-secondary, hover → text-primary    (subdued nav)
 */
const buttonVariants = cva(
  "inline-flex items-center gap-2 whitespace-nowrap rounded-none border-0 bg-transparent p-0 font-sans transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 select-none [&:hover_.btn-arrow]:translate-x-1",
  {
    variants: {
      variant: {
        light:
          "text-text-primary hover:text-green-300",
        dark:
          "text-[#0A0A0A] hover:text-green-700",
        muted:
          "text-text-secondary hover:text-text-primary",
      },
      size: {
        sm: "text-label",
        md: "text-label-bold",
        lg: "text-link-lg",
      },
    },
    defaultVariants: { variant: "light", size: "sm" },
  },
);

type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
