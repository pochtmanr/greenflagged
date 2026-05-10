import Link from "next/link";
import { cn } from "@/lib/cn";

type WordmarkProps = {
  className?: string;
  href?: string;
  asLink?: boolean;
};

export function Wordmark({
  className,
  href = "/",
  asLink = true,
}: WordmarkProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-label text-[13px] tracking-[0.32px]",
        className,
      )}
    >
      <span className="font-bold tracking-[-0.01em]">GREEN</span>
      <span
        aria-hidden
        className="size-2 rounded-full bg-green-300"
        style={{ boxShadow: "0 0 12px var(--green-400)" }}
      />
      <span className="font-bold tracking-[-0.01em]">FLAGGED</span>
    </span>
  );

  if (!asLink) return content;
  return (
    <Link href={href} aria-label="Green Flagged home">
      {content}
    </Link>
  );
}
