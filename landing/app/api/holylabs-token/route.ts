import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const HOLYLABS_URL = process.env.NEXT_PUBLIC_HOLYLABS_URL;
const HOLYLABS_SK = process.env.HOLYLABS_SK_LIVE;

export async function POST() {
  if (!HOLYLABS_URL || !HOLYLABS_SK) {
    return NextResponse.json({ error: "widget disabled" }, { status: 503 });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth required" }, { status: 401 });
  }

  const res = await fetch(`${HOLYLABS_URL}/api/v1/widget-tokens`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${HOLYLABS_SK}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? "Anonymous",
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url,
      allowed_kinds: ["support"],
      ttl_seconds: 3600,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[holylabs-token] mint failed", res.status, detail);
    return NextResponse.json({ error: "token mint failed" }, { status: 502 });
  }

  const { token, expires_at } = (await res.json()) as {
    token: string;
    expires_at: string;
  };
  return NextResponse.json({ token, expires_at });
}
