"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import type { IpSharedValue } from "@/lib/contracts/types";

type Props = {
  value: IpSharedValue;
  onChange: (next: IpSharedValue) => void;
};

export function DEFAULT_IP_SHARED(): IpSharedValue {
  return { provider_pct: 50, client_pct: 50, additional: [] };
}

function clampPct(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function IpSharedFields({ value, onChange }: Props) {
  const total =
    value.provider_pct +
    value.client_pct +
    value.additional.reduce((sum, p) => sum + p.pct, 0);

  const valid = total === 100;

  return (
    <div className="ip-shared">
      <span
        className="gf-mono-sm"
        style={{
          color: "var(--fg-2)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontSize: 11,
        }}
      >
        Ownership split (%)
      </span>

      <Row
        label="Provider (you)"
        pct={value.provider_pct}
        onPct={(pct) => onChange({ ...value, provider_pct: clampPct(pct) })}
      />
      <Row
        label="Client"
        pct={value.client_pct}
        onPct={(pct) => onChange({ ...value, client_pct: clampPct(pct) })}
      />

      {value.additional.map((p, i) => (
        <Row
          key={i}
          label=""
          inputName
          name={p.name}
          onName={(name) =>
            onChange({
              ...value,
              additional: value.additional.map((x, j) =>
                j === i ? { ...x, name } : x,
              ),
            })
          }
          pct={p.pct}
          onPct={(pct) =>
            onChange({
              ...value,
              additional: value.additional.map((x, j) =>
                j === i ? { ...x, pct: clampPct(pct) } : x,
              ),
            })
          }
          onRemove={() =>
            onChange({
              ...value,
              additional: value.additional.filter((_, j) => j !== i),
            })
          }
        />
      ))}

      <button
        type="button"
        className="gf-btn-ghost"
        onClick={() =>
          onChange({
            ...value,
            additional: [...value.additional, { name: "", pct: 0 }],
          })
        }
        style={{ alignSelf: "flex-start", padding: "6px 12px", fontSize: 12, height: "auto" }}
      >
        <Plus size={14} style={{ marginRight: 6 }} />
        Add third party
      </button>

      <div
        className={
          "ip-shared__total " + (valid ? "is-valid" : "is-invalid")
        }
      >
        <span>Total</span>
        <span>{total}% {valid ? "" : "(must sum to 100)"}</span>
      </div>
    </div>
  );
}

type RowProps = {
  label: string;
  pct: number;
  onPct: (n: number) => void;
  inputName?: boolean;
  name?: string;
  onName?: (s: string) => void;
  onRemove?: () => void;
};

function Row({
  label,
  pct,
  onPct,
  inputName,
  name,
  onName,
  onRemove,
}: RowProps) {
  return (
    <div className="ip-shared__row">
      {inputName ? (
        <input
          className="gf-input"
          type="text"
          placeholder="Third-party name"
          value={name ?? ""}
          onChange={(e) => onName?.(e.target.value)}
        />
      ) : (
        <span className="gf-body-sm" style={{ color: "var(--fg-1)" }}>
          {label}
        </span>
      )}
      <input
        className="gf-input"
        type="number"
        min={0}
        max={100}
        step={1}
        value={pct}
        onChange={(e) => {
          const raw = e.target.value;
          onPct(raw === "" ? 0 : Number(raw));
        }}
      />
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove party"
          onClick={onRemove}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            border: "1px solid var(--rule)",
            background: "transparent",
            color: "var(--fg-3)",
            cursor: "pointer",
          }}
        >
          <X size={14} />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
