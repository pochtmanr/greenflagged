import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
import { DotMatrixCanvas } from "@/components/brand/dot-matrix-canvas";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DotMatrixCanvas />
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-8 lg:px-12">
          <Wordmark />
          <Link
            href="/"
            className="text-label inline-flex items-center gap-2 text-text-secondary transition-colors hover:text-green-300"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>
      </header>
      <main className="relative pt-16">{children}</main>
    </>
  );
}
