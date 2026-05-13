"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getSupabaseServer,
  getSupabaseServiceRole,
} from "@/lib/supabase/server";
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

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(input: unknown): Promise<UpdateProfileResult> {
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

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteAccount(): Promise<DeleteAccountResult> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in" };
  }

  const admin = getSupabaseServiceRole();

  // Best-effort: clear any storage files under the user's folder.
  // Storage RLS is bypassed by the service role.
  try {
    const { data: files } = await admin.storage
      .from("contracts")
      .list(user.id, { limit: 1000 });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("contracts").remove(paths);
    }
  } catch {
    // ignore — auth user delete still proceeds; cascade DB cleanup handles rows
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { ok: false, error: error.message };
  }

  // Cascade deletes profiles + contracts + contract_versions + scans +
  // usage_events via `on delete cascade` references to auth.users.

  // Drop the session cookies for the now-deleted user.
  await supabase.auth.signOut();

  return { ok: true };
}
