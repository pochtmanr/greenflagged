import { NextResponse } from "next/server";
import { getSupabaseFromRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 500 * 1024; // 500 KB
const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/svg+xml", "svg"],
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: profileId } = await params;

  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing form field 'file'" },
      { status: 400 },
    );
  }

  const contentType = file.type || "application/octet-stream";
  const ext = ALLOWED.get(contentType);
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, or SVG." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 500 KB." },
      { status: 413 },
    );
  }

  // Ownership check — RLS will block writes from other users, but verify
  // up-front so we can surface a 404 instead of a storage policy denial.
  const { data: profile, error: pErr } = await supabase
    .from("business_profiles")
    .select("id, owner_id")
    .eq("id", profileId)
    .maybeSingle();
  if (pErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  if (profile.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path = `business_profiles/${user.id}/${profileId}/logo.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const upload = await supabase.storage
    .from("contracts")
    .upload(path, new Uint8Array(bytes), {
      contentType,
      upsert: true,
    });

  if (upload.error) {
    return NextResponse.json(
      { error: "Failed to upload logo", detail: upload.error.message },
      { status: 500 },
    );
  }

  const { error: updErr } = await supabase
    .from("business_profiles")
    .update({ logo_path: path })
    .eq("id", profileId);

  if (updErr) {
    return NextResponse.json(
      { error: "Failed to persist logo path", detail: updErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ logo_path: path });
}
