"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ContractIndustry,
  ContractKind,
  VerdictSeverity,
} from "@/lib/supabase/types";
import { ContractRowMenu } from "@/components/contracts/row-menu";

export type ContractsTableRow = {
  id: string;
  title: string | null;
  kind: ContractKind;
  industry: ContractIndustry | null;
  verdict_severity: VerdictSeverity | null;
  created_at: string;
};

type KindFilter = "all" | ContractKind;
type IndustryFilter = "all" | ContractIndustry | "custom";
type SortKey = "newest" | "oldest" | "title" | "severity";

const KIND_FILTERS: Array<[KindFilter, string]> = [
  ["all", "ALL"],
  ["scanned", "SCANNED"],
  ["drafted", "DRAFTED"],
];

const INDUSTRY_OPTIONS: Array<[IndustryFilter, string]> = [
  ["all", "All industries"],
  ["freelance", "Freelance"],
  ["software", "Software"],
  ["design", "Design"],
  ["nda", "NDA"],
  ["custom", "Custom / other"],
];

const SORT_OPTIONS: Array<[SortKey, string]> = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["title", "Title A–Z"],
  ["severity", "Severity"],
];

const SEVERITY_TAG: Record<VerdictSeverity, string> = {
  green: "sev-green",
  yellow: "sev-yellow",
  orange: "sev-orange",
  red: "sev-red",
};

// red is "worst" so it sorts first when sorting by severity. Nulls go last.
const SEVERITY_RANK: Record<VerdictSeverity, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
  green: 3,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function industryLabel(industry: ContractIndustry | null): string {
  if (!industry) return "Custom";
  return industry.charAt(0).toUpperCase() + industry.slice(1);
}

type Props = {
  contracts: ContractsTableRow[];
};

export function ContractsTable({ contracts }: Props) {
  const router = useRouter();
  const [kindFilter, setKindFilter] = React.useState<KindFilter>("all");
  const [industryFilter, setIndustryFilter] =
    React.useState<IndustryFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const visible = React.useMemo(() => {
    const filtered = contracts.filter((c) => {
      if (kindFilter !== "all" && c.kind !== kindFilter) return false;
      if (industryFilter === "all") return true;
      if (industryFilter === "custom") {
        // Custom = null industry OR a value outside the known enum.
        const known: ContractIndustry[] = [
          "freelance",
          "software",
          "design",
          "nda",
        ];
        return c.industry === null || !known.includes(c.industry);
      }
      return c.industry === industryFilter;
    });

    const sorted = [...filtered];
    switch (sort) {
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime(),
        );
        break;
      case "title":
        sorted.sort((a, b) =>
          (a.title ?? "Untitled contract").localeCompare(
            b.title ?? "Untitled contract",
            undefined,
            { sensitivity: "base" },
          ),
        );
        break;
      case "severity":
        sorted.sort((a, b) => {
          const ra = a.verdict_severity
            ? SEVERITY_RANK[a.verdict_severity]
            : Number.POSITIVE_INFINITY;
          const rb = b.verdict_severity
            ? SEVERITY_RANK[b.verdict_severity]
            : Number.POSITIVE_INFINITY;
          return ra - rb;
        });
        break;
    }
    return sorted;
  }, [contracts, kindFilter, industryFilter, sort]);

  const handleClone = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}/clone`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Clone failed (${res.status})`);
      }
      const data = (await res.json()) as { contract_id: string };
      router.push(`/contracts/${data.contract_id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, title: string | null) => {
    const label = title ?? "this contract";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Delete failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  if (contracts.length === 0) {
    return <ContractsEmptyState />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        className="contracts-toolbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {KIND_FILTERS.map(([value, label]) => {
              const active = kindFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKindFilter(value)}
                  className="gf-tag"
                  style={{
                    cursor: "pointer",
                    background: active ? "var(--ink-500)" : "transparent",
                    color: active ? "var(--paper-0)" : "var(--fg-2)",
                    borderColor: active ? "var(--ink-500)" : "var(--rule)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label
            className="gf-mono-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--fg-3)",
            }}
          >
            <span style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Industry
            </span>
            <select
              className="gf-input"
              style={{ width: "auto", padding: "8px 10px", fontSize: 12 }}
              value={industryFilter}
              onChange={(e) =>
                setIndustryFilter(e.target.value as IndustryFilter)
              }
            >
              {INDUSTRY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <label
            className="gf-mono-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--fg-3)",
            }}
          >
            <span style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Sort
            </span>
            <select
              className="gf-input"
              style={{ width: "auto", padding: "8px 10px", fontSize: 12 }}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <Link href="/contracts/new" className="gf-btn gf-btn-accent">
            + New contract <span className="arrow">→</span>
          </Link>
        </div>
      </div>

      {error ? (
        <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
          {error}
        </p>
      ) : null}

      <div className="gf-frame" style={{ padding: 0 }}>
        <span className="gf-frame-bl" />
        <span className="gf-frame-br" />

        <div
          className="contracts-table__head"
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 2.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 36px",
            gap: 16,
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px dashed var(--rule-soft)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--fg-3)",
          }}
        >
          <span>Title</span>
          <span>Kind</span>
          <span>Industry</span>
          <span>Severity</span>
          <span>Created</span>
          <span aria-hidden />
        </div>

        {visible.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--fg-3)",
            }}
            className="gf-body-sm"
          >
            No contracts match these filters.
          </div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {visible.map((row, idx) => (
              <TableRow
                key={row.id}
                row={row}
                last={idx === visible.length - 1}
                busy={busyId === row.id}
                onClone={handleClone}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TableRow({
  row,
  last,
  busy,
  onClone,
  onDelete,
}: {
  row: ContractsTableRow;
  last: boolean;
  busy: boolean;
  onClone: (id: string) => void;
  onDelete: (id: string, title: string | null) => void;
}) {
  const severityTag = row.verdict_severity ? (
    <span className={`gf-tag ${SEVERITY_TAG[row.verdict_severity]}`}>
      {row.verdict_severity.toUpperCase()}
    </span>
  ) : null;

  return (
    <li
      style={{
        borderBottom: last ? "none" : "1px dashed var(--rule-soft)",
      }}
    >
      <div
        className="contracts-table__row"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2.4fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 36px",
          gap: 16,
          alignItems: "center",
          padding: "14px 16px",
        }}
      >
        <Link
          href={`/contracts/${row.id}`}
          className="gf-body-sm col-title"
          style={{
            color: "var(--fg-1)",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.title ?? "Untitled contract"}
        </Link>
        <span className="gf-tag col-kind" style={{ justifySelf: "start" }}>
          {row.kind.toUpperCase()}
        </span>
        <span
          className="gf-mono-sm col-industry"
          style={{
            color: "var(--fg-2)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {industryLabel(row.industry)}
        </span>
        <span className="col-severity">
          {severityTag ?? (
            <span className="gf-mono-sm" style={{ color: "var(--fg-4)" }}>
              —
            </span>
          )}
        </span>
        <span className="gf-mono-sm col-created" style={{ color: "var(--fg-3)" }}>
          {formatDate(row.created_at)}
        </span>
        <div className="col-menu">
          <ContractRowMenu
            row={row}
            busy={busy}
            onClone={onClone}
            onDelete={onDelete}
          />
        </div>
        {/* Mobile-only fold-ins. Hidden on desktop, displayed by the
            (max-width: 760px) media query on .contracts-table__row. */}
        <div className="col-tags" aria-hidden>
          <span className="gf-tag">{row.kind.toUpperCase()}</span>
          {severityTag}
        </div>
        <div className="col-meta" aria-hidden>
          <span className="gf-mono-sm">{industryLabel(row.industry)}</span>
          <span className="gf-mono-sm">{formatDate(row.created_at)}</span>
        </div>
      </div>
    </li>
  );
}

function ContractsEmptyState() {
  return (
    <div
      className="gf-card"
      style={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: 48,
      }}
    >
      <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
        // NO CONTRACTS YET
      </span>
      <h3 className="gf-h3">Nothing here — yet.</h3>
      <p
        className="gf-body-sm"
        style={{ color: "var(--fg-2)", maxWidth: 440 }}
      >
        Start by scanning a contract to get the verdict, or draft a new one
        from a template.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/scan" className="gf-btn gf-btn-accent">
          Open scanner <span className="arrow">→</span>
        </Link>
        <Link href="/contracts/new" className="gf-btn">
          Start drafting <span className="arrow">→</span>
        </Link>
      </div>
    </div>
  );
}
