import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button — GreenFlagged kit primitive.
 *
 *   variant="solid" → .gf-btn        (ink fill, paper text, sage hover)
 *   variant="ghost" → .gf-btn-ghost  (transparent, fg-1 border, inverts on hover)
 *   variant="link"  → .gf-btn-link   (transparent, underlined mono caps)
 */
const buttonVariants = cva("", {
  variants: {
    variant: {
      solid: "gf-btn",
      ghost: "gf-btn gf-btn-ghost",
      link: "gf-btn-link",
    },
  },
  defaultVariants: { variant: "solid" },
});

type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
