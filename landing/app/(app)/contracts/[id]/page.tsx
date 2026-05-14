import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CloneContractButton } from "@/components/contracts/clone-contract-button";
import { VerdictView } from "@/components/contracts/verdict-view";
import type { Redline, TaxonomyEntry } from "@/lib/ai/review";
import { MarkdownPreview } from "@/lib/markdown/render-react";
import { coerceStyle } from "@/lib/pdf/themes";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { VerdictSeverity } from "@/lib/supabase/types";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Contract · ${id.slice(0, 8)}`,
    robots: { index: false, follow: false },
  };
}

const SEV_CLASS: Record<VerdictSeverity, string> = {
  green: "sev-green",
  yellow: "sev-yellow",
  orange: "sev-orange",
  red: "sev-red",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ContractPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(
      "id,owner_id,kind,industry,title,verdict_severity,created_at,storage_path,style",
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

  // kind === 'drafted' — Phase 2 drafted-contract view.
  const { data: versions } = await supabase
    .from("contract_versions")
    .select("id,version,body_md,created_at")
    .eq("contract_id", id)
    .order("version", { ascending: false });

  const latest = versions?.[0] ?? null;
  const versionCount = versions?.length ?? 0;
  const style = coerceStyle(contract.style);
  const styleTagParts: string[] = [
    style.typography.toUpperCase(),
    style.accent.toUpperCase(),
    style.layout.replace("-", " ").toUpperCase(),
    style.logo_placement === "none"
      ? "NO LOGO"
      : `${style.logo_placement.toUpperCase()} LOGO`,
  ];

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Link
            href="/dashboard"
            className="gf-btn-link"
            style={{ alignSelf: "flex-start" }}
          >
            ← Back to dashboard
          </Link>

          <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              className="gf-label"
              style={{ color: "var(--accent-strong)" }}
            >
              // {contract.kind.toUpperCase()}
              {contract.industry ? ` · ${contract.industry.toUpperCase()}` : ""}
            </span>
            <h1 className="gf-h3" style={{ margin: 0 }}>
              {contract.title ?? "Untitled contract"}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <span className="gf-tag">DRAFTED</span>
              <span
                className="gf-mono-sm"
                style={{ color: "var(--fg-3)" }}
              >
                {versionCount} version{versionCount === 1 ? "" : "s"} ·{" "}
                {formatDate(contract.created_at)}
              </span>
              {styleTagParts.map((part) => (
                <span key={part} className="gf-tag">
                  {part}
                </span>
              ))}
            </div>
          </header>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={`/contracts/${contract.id}/edit`} className="gf-btn">
              Edit <span className="arrow">→</span>
            </Link>
            {latest?.body_md ? (
              <a
                href={`/api/contracts/${contract.id}/pdf`}
                className="gf-btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            ) : null}
            {latest?.body_md ? (
              <a
                href={`/api/contracts/${contract.id}/docx`}
                className="gf-btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download DOCX
              </a>
            ) : null}
            {latest?.body_md ? (
              <CloneContractButton contractId={contract.id} />
            ) : null}
            <Link href="/contracts/new" className="gf-btn-ghost">
              Create another
            </Link>
          </div>

          <div className="content--reading" style={{ width: "100%" }}>
            <div className="gf-card">
              {latest?.body_md ? (
                <MarkdownPreview source={latest.body_md} />
              ) : (
                <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
                  This draft has no body yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
