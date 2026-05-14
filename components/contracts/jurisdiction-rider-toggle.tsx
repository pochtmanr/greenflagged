"use client";

import * as React from "react";
import { getJurisdiction } from "@/lib/contracts/jurisdictions";

type Props = {
  /** ISO-style code from JURISDICTIONS, e.g. "DE", "UK", "US". */
  code: string;
  /** Whether the optional rider is enabled. */
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function JurisdictionRiderToggle({ code, enabled, onChange }: Props) {
  const juris = getJurisdiction(code);
  if (!juris) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 12,
        border: "1px dashed var(--rule)",
        background: "var(--surface)",
      }}
    >
      <p
        className="gf-body-sm"
        style={{
          color: "var(--fg-2)",
          margin: 0,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {juris.notes}
      </p>
      {juris.rider ? (
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            style={{ marginTop: 4 }}
          />
          <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              className="gf-mono-sm"
              style={{
                color: "var(--fg-1)",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {juris.rider.label}
            </span>
            <span
              className="gf-body-sm"
              style={{ color: "var(--fg-3)", fontSize: 12 }}
            >
              {juris.rider.description}
            </span>
          </span>
        </label>
      ) : null}
    </div>
  );
}
