"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/brand/theme-toggle";

const LINKS: Array<[label: string, href: string]> = [
  ["How it works", "/how-it-works"],
  ["Use cases", "/use-cases"],
  ["Pricing", "/pricing"],
  ["Blog", "/blog"],
];

export function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const toggleRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        toggleRef.current &&
        !toggleRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={"nav " + (scrolled ? "nav--scrolled" : "")}>
      <div className="nav__inner">
        <Wordmark />
        <nav className="nav__links">
          {LINKS.map(([label, href]) => (
            <Link key={href} href={href} className="nav__link">
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav__actions">
          <ThemeToggle />
          <Link href="/sign-in" className="nav__link">
            Sign in
          </Link>
          <Link href="/#hero-drop" className="gf-btn nav__cta">
            Try one free <span className="arrow">→</span>
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="nav__mobile-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>
      <div
        ref={panelRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="false"
        aria-label="Site navigation"
        className={"nav__mobile-panel " + (open ? "is-open" : "")}
        hidden={!open}
      >
        {LINKS.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="nav__mobile-link"
            onClick={close}
          >
            {label}
          </Link>
        ))}
        <Link
          href="/sign-in"
          className="nav__mobile-link"
          onClick={close}
        >
          Sign in
        </Link>
        <Link
          href="/#hero-drop"
          className="gf-btn nav__mobile-cta"
          onClick={close}
        >
          Try one free <span className="arrow">→</span>
        </Link>
      </div>
    </header>
  );
}
