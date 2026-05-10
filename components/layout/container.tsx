import * as React from "react";
import { cn } from "@/lib/cn";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "main" | "header" | "footer";
  bleed?: boolean;
};

export function Container({
  className,
  as: Tag = "div",
  bleed = false,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full",
        bleed
          ? "px-4 md:px-8"
          : "px-4 md:px-8 lg:px-12 max-w-[1440px]",
        className,
      )}
      {...props}
    />
  );
}
