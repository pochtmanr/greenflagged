import { notFound } from "next/navigation";
import { VerdictView } from "@/components/contracts/verdict-view";
import type { Redline, TaxonomyEntry } from "@/lib/ai/review";
import { getSupabaseServer } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Verdict · ${id.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
}

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(
      "id, owner_id, kind, title, verdict_severity, created_at, storage_path"
    )
    .eq("id", id)
    .maybeSingle();

  if (contractError || !contract) notFound();
  if (contract.owner_id !== user.id) notFound();

  if (contract.kind === "scanned") {
    const { data: scan } = await supabase
      .from("scans")
      .select("verdict_md, taxonomy, redlines, created_at")
      .eq("contract_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const severity = contract.verdict_severity ?? "yellow";
    const taxonomy =
      (scan?.taxonomy as Record<string, TaxonomyEntry> | null) ?? {};
    const redlines = Array.isArray(scan?.redlines)
      ? (scan!.redlines as Redline[])
      : [];

    return (
      <VerdictView
        contractId={contract.id}
        title={contract.title ?? "Untitled contract"}
        severity={severity}
        reviewedAt={scan?.created_at ?? contract.created_at}
        verdictMd={
          scan?.verdict_md ??
          "_The reviewer didn't return a verdict for this contract — try scanning again._"
        }
        taxonomy={taxonomy}
        redlines={redlines}
      />
    );
  }

  // kind === 'drafted' — Phase 2 owns this branch.
  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 640,
          }}
        >
          <span className="gf-label">// DRAFT</span>
          <h1 className="gf-h1">{contract.title ?? "Untitled draft"}</h1>
          <p className="gf-body" style={{ color: "var(--fg-2)" }}>
            The drafting view ships with Phase 2. This contract was created on{" "}
            {new Date(contract.created_at).toLocaleDateString()}.
          </p>
        </div>
      </div>
    </section>
  );
}
