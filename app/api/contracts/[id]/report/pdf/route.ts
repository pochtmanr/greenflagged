import { NextResponse } from "next/server";

// TODO(phase-3): wire @react-pdf/renderer to emit a real PDF of the verdict.
// Phase 2 may add the renderer wrapper; if so, swap this stub for the shared util.
//
// Until then return a 501 so the UI link reports something predictable rather
// than 404'ing.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      error: "PDF report rendering is not yet implemented",
      contract_id: id,
    },
    { status: 501 }
  );
}
