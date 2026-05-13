"use client";

import * as React from "react";
import type {
  ContractKind,
  VerdictSeverity,
} from "@/lib/supabase/types";

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
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = React.useMemo(() => {
    if (filter === "all") return contracts;
    return contracts.filter((c) => c.kind === filter);
  }, [contracts, filter]);

  return (
    <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
            <li
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "12px 0",
                borderTop:
                  idx === 0 ? "none" : "1px solid var(--rule-soft, var(--rule))",
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
                  {c.title ?? "Untitled contract"}
                </span>
                <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
                  {formatDate(c.created_at)}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
              >
                <span className="gf-tag">{c.kind.toUpperCase()}</span>
                {c.verdict_severity ? (
                  <span className={`gf-tag ${SEVERITY_TAG[c.verdict_severity]}`}>
                    {c.verdict_severity.toUpperCase()}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
