import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/app-nav";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <>
      <AppNav email={user.email ?? null} />
      <main style={{ paddingTop: 64 }}>{children}</main>
    </>
  );
}
