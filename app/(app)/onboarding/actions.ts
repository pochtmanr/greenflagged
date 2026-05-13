"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { COUNTRY_CODES } from "@/lib/countries";
import { INDUSTRY_SLUGS } from "@/lib/industries";

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
  industries: z
    .array(z.string())
    .min(1, { message: "Pick at least one industry" })
    .max(INDUSTRY_SLUGS.size)
    .refine((arr) => arr.every((s) => INDUSTRY_SLUGS.has(s)), {
      message: "Unknown industry",
    }),
});

export type OnboardingResult =
  | { ok: true }
  | { ok: false; error: string };

export async function completeOnboarding(
  input: unknown
): Promise<OnboardingResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { account_type, country_code, industries } = parsed.data;
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
      industries,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  redirect("/dashboard");
}
