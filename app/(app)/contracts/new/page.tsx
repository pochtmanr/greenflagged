import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ContractWizard } from "@/components/contracts/contract-wizard";

export const metadata: Metadata = {
  title: "New contract",
  description: "Draft a new contract with Green Flagged.",
  robots: { index: false, follow: false },
};

export default async function NewContractPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name,country_code")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <ContractWizard
      defaults={{
        provider_name: profile?.business_name ?? null,
        provider_country: profile?.country_code ?? null,
      }}
    />
  );
}
