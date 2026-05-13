"use client";

import * as React from "react";
import type { AddressValue, NameValue } from "@/lib/contracts/types";

export type SavedBusinessProfile = {
  id: string;
  first_name: string | null;
  family_name: string | null;
  business_name: string | null;
  label: string | null;
  country_code: string | null;
  city: string | null;
  street: string | null;
  postal_code: string | null;
  is_default: boolean;
};

type Props = {
  profiles: SavedBusinessProfile[];
  onPick: (name: NameValue, addr: AddressValue) => void;
};

function profileLabel(p: SavedBusinessProfile): string {
  if (p.label?.trim()) return p.label.trim();
  const personal = [p.first_name, p.family_name].filter(Boolean).join(" ").trim();
  if (p.business_name && personal) return `${p.business_name} — ${personal}`;
  return p.business_name || personal || "Unnamed profile";
}

export function BusinessProfilePicker({ profiles, onPick }: Props) {
  if (profiles.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span
        className="gf-mono-sm"
        style={{
          color: "var(--fg-3)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {"// Saved profiles"}
      </span>
      <select
        className="gf-input"
        defaultValue=""
        style={{ appearance: "auto" }}
        onChange={(e) => {
          const p = profiles.find((x) => x.id === e.target.value);
          if (!p) return;
          onPick(
            {
              first: p.first_name ?? "",
              family: p.family_name ?? "",
              business: p.business_name ?? "",
            },
            {
              country: p.country_code ?? "",
              city: p.city ?? "",
              street: p.street ?? "",
              postal: p.postal_code ?? "",
            },
          );
          e.currentTarget.value = "";
        }}
      >
        <option value="">Select an existing profile…</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {profileLabel(p)}
            {p.is_default ? " (default)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
