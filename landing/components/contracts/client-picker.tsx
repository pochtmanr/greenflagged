"use client";

import * as React from "react";
import { Dropdown } from "@/components/ui/dropdown";
import type { AddressValue, NameValue } from "@/lib/contracts/types";

export type SavedClient = {
  id: string;
  first_name: string | null;
  family_name: string | null;
  business_name: string | null;
  country_code: string | null;
  city: string | null;
  street: string | null;
  postal_code: string | null;
};

type Props = {
  clients: SavedClient[];
  onPick: (name: NameValue, addr: AddressValue) => void;
  /** Controlled selected id. If omitted, the picker manages its own state. */
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
};

function clientLabel(c: SavedClient): string {
  const personal = [c.first_name, c.family_name].filter(Boolean).join(" ").trim();
  if (c.business_name && personal) return `${c.business_name} — ${personal}`;
  return c.business_name || personal || "Unnamed";
}

export function ClientPicker({
  clients,
  onPick,
  selectedId,
  onSelectedIdChange,
}: Props) {
  const [internalId, setInternalId] = React.useState<string | null>(null);
  const id = selectedId !== undefined ? selectedId : internalId;

  if (clients.length === 0) return null;

  const handleChange = (nextId: string) => {
    const c = clients.find((x) => x.id === nextId);
    if (!c) return;
    if (onSelectedIdChange) onSelectedIdChange(nextId);
    else setInternalId(nextId);
    onPick(
      {
        first: c.first_name ?? "",
        family: c.family_name ?? "",
        business: c.business_name ?? "",
      },
      {
        country: c.country_code ?? "",
        city: c.city ?? "",
        street: c.street ?? "",
        postal: c.postal_code ?? "",
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
        {"// Saved clients"}
      </span>
      <Dropdown
        value={id}
        onChange={handleChange}
        options={clients.map((c) => ({ value: c.id, label: clientLabel(c) }))}
        placeholder="Select an existing client…"
        aria-label="Saved clients"
      />
    </div>
  );
}
