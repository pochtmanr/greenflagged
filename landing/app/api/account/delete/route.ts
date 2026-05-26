import { NextResponse } from "next/server";
import { getSupabaseFromRequest, getSupabaseServiceRole } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseServiceRole();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to delete account" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
