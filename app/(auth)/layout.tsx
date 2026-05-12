import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/brand/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="nav nav--scrolled">
        <div className="nav__inner">
          <Wordmark />
          <div className="nav__actions">
            <ThemeToggle />
            <Link href="/" className="gf-btn-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </header>
      <main style={{ paddingTop: 64 }}>{children}</main>
    </>
  );
}
