"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function Nav() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-colors duration-300",
        scrolled
          ? "bg-[var(--bg)]/85 backdrop-blur-md border-b border-border-glass"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8 lg:px-12">
        <Wordmark />

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-label text-text-secondary transition-colors hover:text-green-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="#"
            className="text-label text-text-secondary transition-colors hover:text-green-300"
          >
            Sign in
          </Link>
          <Button asChild size="md" variant="light">
            <Link href="/#hero-drop">
              Try one free
              <ArrowRight className="btn-arrow size-3.5 transition-transform" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex size-10 items-center justify-center text-text-primary"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="md:hidden border-t border-border-glass bg-[var(--bg)]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-label text-text-primary transition-colors hover:text-green-300"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#"
              onClick={() => setOpen(false)}
              className="py-3 text-label text-text-secondary transition-colors hover:text-green-300"
            >
              Sign in
            </Link>
            <Button
              asChild
              className="mt-4 self-start"
              size="lg"
              variant="light"
            >
              <Link href="/#hero-drop" onClick={() => setOpen(false)}>
                Try one free
                <ArrowRight className="btn-arrow size-4 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
