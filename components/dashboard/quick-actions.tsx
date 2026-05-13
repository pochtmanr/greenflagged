import Link from "next/link";

type Action = {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  /** Which gf-btn variant to render the CTA span as. */
  ctaVariant: "accent" | "ink";
};

const ACTIONS: Action[] = [
  {
    href: "/scan",
    eyebrow: "// 01 / SCAN",
    title: "Scan a contract",
    body: "Drop a PDF or DOCX. Get the verdict, severity tags, and redlines in under a minute.",
    cta: "Open scanner",
    ctaVariant: "accent",
  },
  {
    href: "/contracts/new",
    eyebrow: "// 02 / DRAFT",
    title: "Create a contract",
    body: "Pick a clean template, answer a few questions, get a draft you can negotiate with.",
    cta: "Start drafting",
    ctaVariant: "ink",
  },
];

export function QuickActions() {
  return (
    <div className="dashboard__quick">
      {ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="gf-frame"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span className="gf-frame-bl" />
          <span className="gf-frame-br" />
          <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
            {a.eyebrow}
          </span>
          <h3 className="gf-h3">{a.title}</h3>
          <p className="gf-body-sm" style={{ color: "var(--fg-2)" }}>
            {a.body}
          </p>
          {/*
            Card itself is the <Link>, so the CTA renders as a styled span,
            not an anchor — never nest anchors.
          */}
          <span
            className={
              a.ctaVariant === "accent"
                ? "gf-btn gf-btn-accent"
                : "gf-btn"
            }
            style={{ marginTop: "auto", alignSelf: "flex-start" }}
          >
            {a.cta} <span className="arrow">→</span>
          </span>
        </Link>
      ))}
    </div>
  );
}
