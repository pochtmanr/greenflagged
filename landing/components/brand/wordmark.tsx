import Link from "next/link";
import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/brand/logo-mark";

type WordmarkProps = {
  className?: string;
  href?: string;
  asLink?: boolean;
  style?: React.CSSProperties;
  /** Hide the GREEN • FLAGGED text and show only the logo mark. */
  markOnly?: boolean;
  /** Show the logo mark alongside the text. Default true. */
  withMark?: boolean;
  /** Logo mark height in px. */
  markSize?: number;
};

export function Wordmark({
  className,
  href = "/",
  asLink = true,
  style,
  markOnly = false,
  withMark = true,
  markSize = 22,
}: WordmarkProps) {
  const showMark = markOnly || withMark;
  const showText = !markOnly;

  const content = (
    <>
      {showMark ? (
        <LogoMark
          size={markSize}
          style={{ color: "var(--green-500)", flexShrink: 0 }}
        />
      ) : null}
      {showText ? <span>GREEN FLAGGED</span> : null}
    </>
  );

  if (!asLink) {
    return (
      <span className={cn("wordmark", className)} style={style}>
        {content}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label="Green Flagged home"
      className={cn("wordmark", className)}
      style={style}
    >
      {content}
    </Link>
  );
}
