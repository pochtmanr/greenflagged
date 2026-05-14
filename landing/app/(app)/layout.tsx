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

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl =
    typeof meta?.avatar_url === "string"
      ? meta.avatar_url
      : typeof meta?.picture === "string"
      ? meta.picture
      : null;

  return (
    <>
      <AppNav email={user.email ?? null} avatarUrl={avatarUrl} />
      <main style={{ paddingTop: 88 }}>{children}</main>
    </>
  );
}
