"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { COUNTRY_CODES } from "@/lib/countries";

const Schema = z.object({
  account_type: z.enum(["solo", "freelancer", "business"]),
  country_code: z
    .string()
    .length(2)
    .refine((v) => COUNTRY_CODES.has(v.toUpperCase()), {
      message: "Unknown country code",
    })
    .transform((v) => v.toUpperCase()),
  business_name: z.string().trim().max(120).optional().nullable(),
});

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(input: unknown): Promise<UpdateProfileResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { account_type, country_code } = parsed.data;
  const business_name =
    account_type === "business" ? parsed.data.business_name?.trim() || null : null;

  if (account_type === "business" && !business_name) {
    return { ok: false, error: "Business name is required" };
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      account_type,
      country_code,
      business_name,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
