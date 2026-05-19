import { NextResponse } from "next/server";
import { getSupabaseFromRequest } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contract, error: cErr } = await supabase
    .from("contracts")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (cErr || !contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (contract.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const prefix = `${user.id}/${id}`;
  const { data: stored } = await supabase.storage
    .from("contracts")
    .list(prefix, { limit: 1000 });
  if (stored && stored.length > 0) {
    const paths = stored.map((entry) => `${prefix}/${entry.name}`);
    await supabase.storage.from("contracts").remove(paths);
  }

  const { error: dErr } = await supabase
    .from("contracts")
    .delete()
    .eq("id", id);

  if (dErr) {
    return NextResponse.json(
      { error: "Failed to delete contract", detail: dErr.message },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
