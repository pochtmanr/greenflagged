"use client";

import * as React from "react";
import { Dropdown } from "@/components/ui/dropdown";
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
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
};

function profileLabel(p: SavedBusinessProfile): string {
  if (p.label?.trim()) return p.label.trim();
  const personal = [p.first_name, p.family_name].filter(Boolean).join(" ").trim();
  if (p.business_name && personal) return `${p.business_name} — ${personal}`;
  return p.business_name || personal || "Unnamed profile";
}

export function BusinessProfilePicker({
  profiles,
  onPick,
  selectedId,
  onSelectedIdChange,
}: Props) {
  const [internalId, setInternalId] = React.useState<string | null>(null);
  const id = selectedId !== undefined ? selectedId : internalId;

  if (profiles.length === 0) return null;

  const handleChange = (nextId: string) => {
    const p = profiles.find((x) => x.id === nextId);
    if (!p) return;
    if (onSelectedIdChange) onSelectedIdChange(nextId);
    else setInternalId(nextId);
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
  };

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
      <Dropdown
        value={id}
        onChange={handleChange}
        options={profiles.map((p) => ({
          value: p.id,
          label: profileLabel(p),
          hint: p.is_default ? "Default" : undefined,
        }))}
        placeholder="Select an existing profile…"
        aria-label="Saved business profiles"
      />
    </div>
  );
}
