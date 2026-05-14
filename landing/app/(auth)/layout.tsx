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
      <header className="nav">
        <div className="nav__inner">
          <span className="gf-frame-bl" aria-hidden />
          <span className="gf-frame-br" aria-hidden />
          <Wordmark />
          <div className="nav__actions">
            <ThemeToggle />
            <Link href="/" className="gf-btn-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </header>
      <main style={{ paddingTop: 88 }}>{children}</main>
    </>
  );
}
