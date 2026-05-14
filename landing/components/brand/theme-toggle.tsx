"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const STORAGE_KEY = "gf-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTheme(readInitial());
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const sys = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setTheme(sys.matches ? "dark" : "light");
      }
    };
    sys.addEventListener("change", onChange);
    return () => sys.removeEventListener("change", onChange);
  }, [mounted]);

  const flip = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — just don't persist */
    }
  };

  return (
    <button
      type="button"
      onClick={flip}
      className="theme-toggle"
      aria-label={
        mounted
          ? theme === "dark"
            ? "Switch to light theme"
            : "Switch to dark theme"
          : "Toggle theme"
      }
      title="Toggle theme"
    >
      {mounted && theme === "dark" ? (
        <Sun aria-hidden width={16} height={16} strokeWidth={1.5} />
      ) : (
        <Moon aria-hidden width={16} height={16} strokeWidth={1.5} />
      )}
    </button>
  );
}
