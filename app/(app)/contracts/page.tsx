import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  ContractsTable,
  type ContractsTableRow,
} from "@/components/contracts/contracts-table";

export const metadata: Metadata = {
  title: "All contracts",
  description: "Every contract you've scanned or drafted with Green Flagged.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ContractsIndexPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data } = await supabase
    .from("contracts")
    .select("id,title,kind,industry,verdict_severity,created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const contracts = (data ?? []) as ContractsTableRow[];

  return (
    <section className="section" style={{ paddingTop: 64 }}>
      <div className="app-shell">
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
              // CONTRACTS
            </span>
            <h1 className="gf-h1">All contracts</h1>
            <p className="gf-body-sm" style={{ color: "var(--fg-2)", maxWidth: 640 }}>
              Every contract you&apos;ve scanned or drafted, in one list. Filter
              by kind or industry, sort by recency, title, or severity.
            </p>
          </header>

          <ContractsTable contracts={contracts} />
        </div>
      </div>
    </section>
  );
}
