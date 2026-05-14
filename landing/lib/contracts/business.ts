// Helpers for resolving a contract's business profile for rendering output.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { BusinessFields } from "@/lib/pdf/render-themed";

export type BusinessProfileForRender = BusinessFields & {
  id: string;
  logo_path: string | null;
};

export async function loadBusinessProfile(
  supabase: SupabaseClient<Database>,
  businessProfileId: string | null | undefined,
): Promise<BusinessProfileForRender | null> {
  if (!businessProfileId) return null;
  const { data, error } = await supabase
    .from("business_profiles")
    .select(
      "id, business_name, first_name, family_name, logo_path, city, street, postal_code, country_code",
    )
    .eq("id", businessProfileId)
    .maybeSingle();
  if (error || !data) return null;

  const addressParts = [data.street, data.city, data.postal_code, data.country_code].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );

  return {
    id: data.id,
    business_name: data.business_name,
    first_name: data.first_name,
    family_name: data.family_name,
    logo_path: data.logo_path,
    address_line: addressParts.length ? addressParts.join(", ") : null,
  };
}
