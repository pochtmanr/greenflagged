import { NextResponse } from "next/server";
import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/countries";
import { getSupabaseFromRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO(types): regenerate lib/supabase/types.ts after migration 0004 is applied.

const ProfilePatch = z
  .object({
    first_name: z.string().trim().min(1),
    family_name: z.string().trim().min(1),
    business_name: z.string().trim().nullable(),
    tax_id: z.string().trim().nullable(),
    email: z.string().email().nullable(),
    phone: z.string().trim().nullable(),
    website: z.string().trim().url().nullable(),
    country_code: z
      .string()
      .length(2)
      .refine((c) => COUNTRY_CODES.has(c), { message: "Unknown country" }),
    city: z.string().trim().min(1),
    street: z.string().trim().min(1),
    postal_code: z.string().trim().min(1),
    label: z.string().trim().nullable(),
    is_default: z.boolean(),
  })
  .partial();

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Strip logo_path if a caller tries to sneak it in — Phase 6 owns that column.
  if (json && typeof json === "object" && "logo_path" in json) {
    delete (json as Record<string, unknown>).logo_path;
  }

  const parsed = ProfilePatch.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  if (parsed.data.is_default === true) {
    const unset = await sb
      .from("business_profiles")
      .update({ is_default: false })
      .eq("owner_id", user.id);
    if (unset.error) {
      return NextResponse.json({ error: unset.error.message }, { status: 500 });
    }
  }

  const patch: Record<string, unknown> = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("business_profiles")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const { error } = await sb.from("business_profiles").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
