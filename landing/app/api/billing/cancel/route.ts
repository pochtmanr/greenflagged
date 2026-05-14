import { NextResponse } from "next/server";
import {
  getSupabaseServer,
  getSupabaseServiceRole,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Cancellation is set via service-role since clients have no write policy
  // on subscriptions. The daily renewal cron flips status -> 'canceled' once
  // current_period_end has passed.
  const service = await getSupabaseServiceRole();
  const { data, error } = await service
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select("plan, status, current_period_end, cancel_at_period_end")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "cancel_failed", detail: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, subscription: data });
}
