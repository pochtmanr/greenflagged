import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { DotMatrixCanvas } from "@/components/brand/dot-matrix-canvas";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DotMatrixCanvas />
      <ScrollProgress />
      <Nav />
      <main className="relative pt-16">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
