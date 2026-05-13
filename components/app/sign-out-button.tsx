"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function SignOutButton({ className, children }: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const onClick = async () => {
    setPending(true);
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={className ?? "gf-btn-link"}
    >
      {pending ? "Signing out…" : children ?? "Sign out"}
    </button>
  );
}
