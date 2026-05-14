"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { SignOutButton } from "@/components/app/sign-out-button";

const LINKS: Array<[label: string, href: string]> = [
  ["Dashboard", "/dashboard"],
  ["Contracts", "/contracts"],
  ["Settings", "/settings"],
];

type Props = {
  email: string | null;
  avatarUrl?: string | null;
};

export function AppNav({ email, avatarUrl }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const toggleRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const menuToggleRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open && !menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMenuOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        open &&
        panelRef.current &&
        !panelRef.current.contains(target) &&
        toggleRef.current &&
        !toggleRef.current.contains(target)
      ) {
        setOpen(false);
      }
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuToggleRef.current &&
        !menuToggleRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, menuOpen]);

  const initial = email ? email[0]?.toUpperCase() : "?";
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <header className="nav">
      <div className="nav__inner">
        <span className="gf-frame-bl" aria-hidden />
        <span className="gf-frame-br" aria-hidden />
        <Wordmark href="/dashboard" />
        <nav className="nav__links">
          {LINKS.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="nav__link"
              style={
                isActive(href)
                  ? { color: "var(--fg-1)" }
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav__actions">
          <ThemeToggle />
          <div className="nav__avatar-wrap">
            <button
              ref={menuToggleRef}
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Account menu"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                overflow: "hidden",
                padding: 0,
                background: avatarUrl ? "transparent" : "var(--ink-500)",
                color: "var(--paper-0)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                lineHeight: 1,
                cursor: "pointer",
                border: "1px solid var(--rule)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  width={32}
                  height={32}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                initial
              )}
            </button>
            {menuOpen ? (
              <div
                ref={menuRef}
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 220,
                  background: "var(--bg)",
                  border: "1px solid var(--rule)",
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "var(--shadow-pop)",
                  zIndex: 50,
                }}
              >
                {email ? (
                  <div
                    className="gf-mono-sm"
                    style={{
                      color: "var(--fg-3)",
                      paddingBottom: 8,
                      borderBottom: "1px solid var(--rule)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {email}
                  </div>
                ) : null}
                <Link
                  href="/settings"
                  className="gf-mono-sm"
                  onClick={() => setMenuOpen(false)}
                  style={{ color: "var(--fg-1)" }}
                >
                  Settings
                </Link>
                <SignOutButton className="gf-mono-sm" />
              </div>
            ) : null}
          </div>
          <button
            ref={toggleRef}
            type="button"
            className="nav__mobile-toggle"
            aria-expanded={open}
            aria-controls="app-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>
      <div
        ref={panelRef}
        id="app-mobile-nav"
        role="dialog"
        aria-modal="false"
        aria-label="App navigation"
        className={"nav__mobile-panel " + (open ? "is-open" : "")}
        hidden={!open}
      >
        <span className="gf-frame-bl" aria-hidden />
        <span className="gf-frame-br" aria-hidden />
        {LINKS.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="nav__mobile-link"
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
        <div className="nav__mobile-row">
          <span className="nav__mobile-row__label">// Theme</span>
          <ThemeToggle />
        </div>
        <SignOutButton className="gf-mono-sm nav__mobile-link">
          Sign out
        </SignOutButton>
      </div>
    </header>
  );
}
