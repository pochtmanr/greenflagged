import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { MarkdownPreview } from "@/lib/markdown/render-react";
import type { VerdictSeverity } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Contract",
  robots: { index: false, follow: false },
};

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

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: contract } = await supabase
    .from("contracts")
    .select("id,kind,industry,title,verdict_severity,created_at")
    .eq("id", id)
    .maybeSingle();

  if (!contract) notFound();

  const { data: versions } = await supabase
    .from("contract_versions")
    .select("id,version,body_md,created_at")
    .eq("contract_id", id)
    .order("version", { ascending: false });

  const latest = versions?.[0] ?? null;
  const versionCount = versions?.length ?? 0;

  const isDrafted = contract.kind === "drafted";

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Link href="/dashboard" className="gf-btn-link" style={{ alignSelf: "flex-start" }}>
            ← Back to dashboard
          </Link>

          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
              // {contract.kind.toUpperCase()}
              {contract.industry ? ` · ${contract.industry.toUpperCase()}` : ""}
            </span>
            <h1 className="gf-h1">{contract.title ?? "Untitled contract"}</h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {isDrafted ? (
                <span className="gf-tag">DRAFTED</span>
              ) : contract.verdict_severity ? (
                <span className={`gf-tag ${SEV_CLASS[contract.verdict_severity]}`}>
                  {contract.verdict_severity.toUpperCase()}
                </span>
              ) : (
                <span className="gf-tag">VERDICT PENDING</span>
              )}
              <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
                {versionCount} version{versionCount === 1 ? "" : "s"} ·{" "}
                {formatDate(contract.created_at)}
              </span>
            </div>
          </header>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {latest?.body_md ? (
              <a
                href={`/api/contracts/${contract.id}/pdf`}
                className="gf-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF <span className="arrow">→</span>
              </a>
            ) : null}
            <Link href="/contracts/new" className="gf-btn-ghost">
              Create another
            </Link>
          </div>

          <div className="gf-card" style={{ maxWidth: 880 }}>
            {latest?.body_md ? (
              <MarkdownPreview source={latest.body_md} />
            ) : isDrafted ? (
              <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
                This draft has no body yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 className="gf-h3" style={{ marginTop: 0 }}>
                  Verdict pending
                </h2>
                <p className="gf-body" style={{ color: "var(--fg-2)" }}>
                  This contract was scanned. The verdict view ships with Phase 3.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
