import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

const COLS = [
  {
    label: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/use-cases", label: "Use cases" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    label: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    label: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/imprint", label: "Imprint" },
      { href: "/cookies", label: "Cookies" },
      { href: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border-glass">
      <div className="mx-auto max-w-[1440px] px-4 py-16 md:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1fr,2fr]">
          <div>
            <Wordmark className="text-[15px]" />
            <p className="mt-6 max-w-xs text-sm leading-6 text-text-secondary">
              AI contract review for freelancers, agencies, and indie founders.
              Get the verdict before you sign.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {COLS.map((col) => (
              <div key={col.label}>
                <div className="text-label text-text-secondary">
                  {col.label}
                </div>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-text-primary transition-colors hover:text-green-300"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border-glass pt-6 text-xs text-text-secondary md:flex-row md:items-center md:justify-between">
          <div>
            © {year} Green Flagged · Operated by Holylabs Ltd. Informational,
            not legal advice.
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              className="transition-colors hover:text-green-300"
            >
              Twitter
            </a>
            <a
              href="mailto:hello@greenflagged.app"
              className="transition-colors hover:text-green-300"
            >
              hello@greenflagged.app
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
