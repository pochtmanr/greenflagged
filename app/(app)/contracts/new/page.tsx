import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ContractWizard } from "@/components/contracts/contract-wizard";
import type { SavedClient } from "@/components/contracts/client-picker";
import type { SavedBusinessProfile } from "@/components/contracts/business-profile-picker";

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

  // TODO(types): drop the `any` cast once `clients` + `business_profiles` are part of the
  // generated Supabase types. (Regenerate `lib/supabase/types.ts` after migration 0004.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  const [profileRes, clientsRes, profilesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("business_name,country_code")
      .eq("user_id", user.id)
      .maybeSingle(),
    sb
      .from("clients")
      .select(
        "id,first_name,family_name,business_name,country_code,city,street,postal_code",
      )
      .order("created_at", { ascending: false }),
    sb
      .from("business_profiles")
      .select(
        "id,first_name,family_name,business_name,label,country_code,city,street,postal_code,is_default",
      )
      .order("created_at", { ascending: false }),
  ]);

  const clients = (clientsRes.data ?? []) as SavedClient[];
  const profiles = (profilesRes.data ?? []) as SavedBusinessProfile[];
  const defaultProfile = profiles.find((p) => p.is_default) ?? null;

  // Default precedence: a saved default business_profile wins over profiles.business_name.
  const defaults = defaultProfile
    ? {
        provider: {
          first: defaultProfile.first_name ?? "",
          family: defaultProfile.family_name ?? "",
          business: defaultProfile.business_name ?? "",
        },
        provider_address: {
          country: defaultProfile.country_code ?? "",
          city: defaultProfile.city ?? "",
          street: defaultProfile.street ?? "",
          postal: defaultProfile.postal_code ?? "",
        },
        provider_country: defaultProfile.country_code ?? null,
      }
    : {
        provider_country: profileRes.data?.country_code ?? null,
      };

  return (
    <ContractWizard
      defaults={defaults}
      clients={clients}
      businessProfiles={profiles}
    />
  );
}
