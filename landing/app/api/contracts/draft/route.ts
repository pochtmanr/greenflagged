import { NextResponse } from "next/server";
import { z } from "zod";
import { guardQuota } from "@/lib/billing/guard";
import { chargeOverage } from "@/lib/billing/revolut";
import { getIndustry } from "@/lib/contracts";
import { renderContractPdf } from "@/lib/pdf/render";
import { isContractStyle, type ContractStyle } from "@/lib/pdf/themes";
import { getSupabaseFromRequest } from "@/lib/supabase/server";
import type { ContractIndustry } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    industry: z.string().min(1),
    answers: z.record(z.string(), z.unknown()).optional(),
    body_md: z.string().optional(),
    title: z.string().optional(),
    jurisdiction: z.string().optional(),
    description: z.string().optional(),
    style: z.unknown().optional(),
    business_profile_id: z.string().uuid().nullable().optional(),
  })
  .refine((b) => b.answers || b.body_md, {
    message: "Either answers or body_md is required",
  });

const TEMPLATE_INDUSTRIES = new Set(["freelance", "software", "design", "nda"]);

export async function POST(req: Request) {
  let payload;
  try {
    payload = BodySchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseFromRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blocked, reserved } = await guardQuota(user.id, "draft");
  if (blocked) return blocked;

  let bodyMd: string;
  let title: string;
  let industryColumn: ContractIndustry | null = null;

  if (payload.body_md && !payload.answers) {
    bodyMd = payload.body_md;
    title = payload.title?.trim() || extractTitleFromMarkdown(bodyMd) || "Custom contract";
    industryColumn = TEMPLATE_INDUSTRIES.has(payload.industry)
      ? (payload.industry as ContractIndustry)
      : null;
  } else {
    const schema = getIndustry(payload.industry);
    if (!schema || !payload.answers) {
      return NextResponse.json(
        { error: `Unknown industry "${payload.industry}"` },
        { status: 400 },
      );
    }

    const parseResult = schema.validator.safeParse(payload.answers);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid answers",
          issues: parseResult.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    bodyMd = schema.render(parseResult.data as Record<string, unknown>);
    title = payload.title?.trim() || schema.buildTitle(parseResult.data as Record<string, unknown>);
    industryColumn = schema.id;
  }

  const style: ContractStyle | null = isContractStyle(payload.style)
    ? payload.style
    : null;
  const businessProfileId: string | null = payload.business_profile_id ?? null;

  // If a business_profile_id was provided, confirm it belongs to this user
  // before persisting it on the contract. RLS would block the insert if it
  // didn't, but failing fast gives a cleaner error.
  if (businessProfileId) {
    const { data: profileCheck } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("id", businessProfileId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!profileCheck) {
      return NextResponse.json(
        { error: "Unknown business profile" },
        { status: 400 },
      );
    }
  }

  const { data: contractRow, error: insertContractErr } = await supabase
    .from("contracts")
    .insert({
      owner_id: user.id,
      kind: "drafted",
      industry: industryColumn,
      title,
      ...(style ? { style } : {}),
      ...(businessProfileId ? { business_profile_id: businessProfileId } : {}),
    })
    .select("id")
    .single();

  if (insertContractErr || !contractRow) {
    return NextResponse.json(
      { error: "Failed to create contract", detail: insertContractErr?.message },
      { status: 500 },
    );
  }

  const contractId = contractRow.id;
  const pdfPath = `${user.id}/${contractId}/v1.pdf`;

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderContractPdf(bodyMd, title);
  } catch (err) {
    await supabase.from("contracts").delete().eq("id", contractId);
    return NextResponse.json(
      {
        error: "Failed to render PDF",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }

  const uploadRes = await supabase.storage
    .from("contracts")
    .upload(pdfPath, new Uint8Array(pdfBuffer), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadRes.error) {
    await supabase.from("contracts").delete().eq("id", contractId);
    return NextResponse.json(
      { error: "Failed to upload PDF", detail: uploadRes.error.message },
      { status: 500 },
    );
  }

  const { error: versionErr } = await supabase.from("contract_versions").insert({
    contract_id: contractId,
    version: 1,
    body_md: bodyMd,
    pdf_path: pdfPath,
  });

  if (versionErr) {
    return NextResponse.json(
      { error: "Failed to record contract version", detail: versionErr.message },
      { status: 500 },
    );
  }

  await supabase.from("contracts").update({ storage_path: pdfPath }).eq("id", contractId);

  await supabase.from("usage_events").insert({
    user_id: user.id,
    kind: "draft",
    contract_id: contractId,
  });

  // Standard tier over included cap: bill the $3 MIT overage out-of-band so
  // the user's draft completes without waiting on Revolut. Failures flip the
  // subscription to past_due + send an ops alert.
  if (reserved && reserved.ok && reserved.overage) {
    void chargeOverage(user.id, contractId).catch((err) => {
      console.error("[overage] chargeOverage threw", err);
    });
  }

  return NextResponse.json({ contract_id: contractId, title });
}

function extractTitleFromMarkdown(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}
