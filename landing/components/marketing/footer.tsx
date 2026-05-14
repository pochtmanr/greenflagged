import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

const COLS: Array<{ l: string; items: Array<[label: string, href: string]> }> = [
  {
    l: "Product",
    items: [
      ["How it works", "/how-it-works"],
      ["Check a contract", "/check"],
      ["Use cases", "/use-cases"],
      ["Pricing", "/pricing"],
    ],
  },
  {
    l: "Company",
    items: [
      ["About", "/about"],
      ["Blog", "/blog"],
      ["Press", "/press"],
      ["Contact", "/contact"],
    ],
  },
  {
    l: "Legal",
    items: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Imprint", "/imprint"],
      ["Disclaimer", "/disclaimer"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__cols">
          {COLS.map((c) => (
            <div key={c.l}>
              <div className="gf-label">{c.l}</div>
              <ul>
                {c.items.map(([t, h]) => (
                  <li key={t}>
                    <Link href={h}>{t}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer__brand">
            <Wordmark style={{ fontSize: 18 }} markSize={32} />
            <p
              className="gf-mono-sm"
              style={{ color: "var(--fg-3)", marginTop: 14, maxWidth: 240 }}
            >
              AI contract review for freelancers, agencies, indie founders, and
              creators.
            </p>
          </div>
        </div>
        <div className="footer__strip">
          <span>© 2026 · Simnetiq Ltd · Informational, not legal advice.</span>
          <a href="mailto:hello@greenflagged.xyz">hello@greenflagged.xyz</a>
        </div>
      </div>
    </footer>
  );
}
