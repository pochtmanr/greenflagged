import { NextResponse } from "next/server";
import { z } from "zod";
import { streamDraft } from "@/lib/ai";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  industry: z.string().min(1),
  description: z.string().min(1, "Describe what the contract is for"),
  jurisdiction: z.string().optional(),
});

export async function POST(req: Request) {
  let payload;
  try {
    payload = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        for await (const delta of streamDraft({
          industry: payload.industry,
          description: payload.description,
          jurisdiction: payload.jurisdiction,
        })) {
          send(JSON.stringify({ type: "delta", text: delta }));
        }
        send(JSON.stringify({ type: "done" }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send(JSON.stringify({ type: "error", message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
