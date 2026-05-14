import { Nav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";
import { CookieBanner } from "@/components/marketing/cookie-banner";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav authed={!!user} />
      <main>{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
