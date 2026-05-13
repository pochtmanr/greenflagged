import { NextResponse } from "next/server";
import { z } from "zod";
import { COUNTRY_CODES } from "@/lib/countries";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TODO(types): regenerate lib/supabase/types.ts after migration 0004 is applied;
// drop the `any` cast once `clients` is part of the generated Database type.

const ClientInput = z.object({
  first_name: z.string().trim().min(1),
  family_name: z.string().trim().min(1),
  business_name: z.string().trim().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  country_code: z
    .string()
    .length(2)
    .refine((c) => COUNTRY_CODES.has(c), { message: "Unknown country" }),
  city: z.string().trim().min(1),
  street: z.string().trim().min(1),
  postal_code: z.string().trim().min(1),
  notes: z.string().trim().optional().nullable(),
  is_default: z.boolean().optional(),
});

export async function GET() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ clients: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServer();
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

  const parsed = ClientInput.safeParse(json);
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
      .from("clients")
      .update({ is_default: false })
      .eq("owner_id", user.id);
    if (unset.error) {
      return NextResponse.json({ error: unset.error.message }, { status: 500 });
    }
  }

  const row = {
    owner_id: user.id,
    first_name: parsed.data.first_name,
    family_name: parsed.data.family_name,
    business_name: parsed.data.business_name ?? null,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    country_code: parsed.data.country_code,
    city: parsed.data.city,
    street: parsed.data.street,
    postal_code: parsed.data.postal_code,
    notes: parsed.data.notes ?? null,
    is_default: parsed.data.is_default === true,
  };

  const { data, error } = await sb
    .from("clients")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ client: data });
}
