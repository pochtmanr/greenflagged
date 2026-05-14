import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/billing/oxapay/verify?order_id=<uuid>
 *
 * Polled by the /checkout/success client. Returns the current state of an
 * OxaPay invoice for the authenticated user.
 *
 *   { status: "paid",    quantity, amount_cents, currency }
 *   { status: "failed",  reason }
 *   { status: "pending", reason? }
 */
export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { status: "unauthenticated" },
      { status: 401 },
    );
  }

  const orderId = req.nextUrl.searchParams.get("order_id");
  if (!orderId) {
    return NextResponse.json(
      { status: "missing_order_id" },
      { status: 400 },
    );
  }

  const { data: row } = await supabase
    .from("payments")
    .select("status, amount_cents, currency, raw")
    .eq("user_id", user.id)
    .eq("provider", "oxapay")
    .filter("raw->>order_id", "eq", orderId)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({
      status: "pending",
      reason: "Invoice not yet registered",
    });
  }

  if (row.status === "succeeded") {
    const rawObj =
      row.raw && typeof row.raw === "object"
        ? (row.raw as Record<string, unknown>)
        : null;
    const rawQty =
      typeof rawObj?.quantity === "number"
        ? rawObj.quantity
        : typeof rawObj?.quantity === "string"
          ? Number.parseInt(rawObj.quantity, 10)
          : NaN;
    const quantity = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1;
    return NextResponse.json({
      status: "paid",
      quantity,
      amount_cents: row.amount_cents,
      currency: row.currency,
    });
  }

  if (row.status === "failed") {
    return NextResponse.json({
      status: "failed",
      reason: "Payment expired or declined",
    });
  }

  return NextResponse.json({ status: "pending" });
}
