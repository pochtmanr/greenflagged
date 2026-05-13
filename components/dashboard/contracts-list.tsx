"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ContractKind,
  VerdictSeverity,
} from "@/lib/supabase/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Row = {
  id: string;
  title: string | null;
  kind: ContractKind;
  verdict_severity: VerdictSeverity | null;
  created_at: string;
};

type Filter = "all" | ContractKind;

type Props = {
  contracts: Row[];
};

const SEVERITY_TAG: Record<VerdictSeverity, string> = {
  green: "sev-green",
  yellow: "sev-yellow",
  orange: "sev-orange",
  red: "sev-red",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ContractsList({ contracts }: Props) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.kind === filter);
  }, [contracts, filter]);

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

  return (
    <div
      className="gf-card"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h3 className="gf-h4">My contracts</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "scanned", "drafted"] as Filter[]).map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="gf-tag"
                style={{
                  cursor: "pointer",
                  background: active ? "var(--ink-500)" : "transparent",
                  color: active ? "var(--paper-0)" : "var(--fg-2)",
                  borderColor: active ? "var(--ink-500)" : "var(--rule)",
                }}
              >
                {f === "all" ? "ALL" : f === "scanned" ? "SCANNED" : "DRAFTED"}
              </button>
            );
          })}
        </div>
      </div>

      {error ? (
        <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
          {contracts.length === 0
            ? "No contracts yet — start with Scan or Create above."
            : `No ${filter} contracts yet.`}
        </p>
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
          {filtered.map((c, idx) => (
            <ContractRow
              key={c.id}
              row={c}
              first={idx === 0}
              busy={busyId === c.id}
              onClone={handleClone}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ContractRow({
  row,
  first,
  busy,
  onClone,
  onDelete,
}: {
  row: Row;
  first: boolean;
  busy: boolean;
  onClone: (id: string) => void;
  onDelete: (id: string, title: string | null) => void;
}) {
  return (
    <li
      style={{
        borderTop: first ? "none" : "1px solid var(--rule-soft, var(--rule))",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 0",
        }}
      >
        <Link
          href={`/contracts/${row.id}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flex: 1,
            minWidth: 0,
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 0,
              flex: 1,
            }}
          >
            <span
              className="gf-body-sm"
              style={{
                color: "var(--fg-1)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.title ?? "Untitled contract"}
            </span>
            <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
              {formatDate(row.created_at)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span className="gf-tag">{row.kind.toUpperCase()}</span>
            {row.verdict_severity ? (
              <span className={`gf-tag ${SEVERITY_TAG[row.verdict_severity]}`}>
                {row.verdict_severity.toUpperCase()}
              </span>
            ) : null}
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Row actions"
              className="gf-row-action"
              onClick={(e) => e.stopPropagation()}
              disabled={busy}
            >
              ⋮
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href={`/contracts/${row.id}`}>Open</Link>
            </DropdownMenuItem>
            {row.kind === "drafted" ? (
              <DropdownMenuItem asChild>
                <Link href={`/contracts/${row.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
            ) : null}
            {row.kind === "drafted" ? (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onClone(row.id);
                }}
              >
                Clone as template
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href={`/api/contracts/${row.id}/pdf`}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF
              </a>
            </DropdownMenuItem>
            {row.kind === "drafted" ? (
              <DropdownMenuItem asChild>
                <a
                  href={`/api/contracts/${row.id}/docx`}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download DOCX
                </a>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              danger
              onSelect={(e) => {
                e.preventDefault();
                onDelete(row.id, row.title);
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
