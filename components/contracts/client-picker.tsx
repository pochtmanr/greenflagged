"use client";

import * as React from "react";
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
};

function clientLabel(c: SavedClient): string {
  const personal = [c.first_name, c.family_name].filter(Boolean).join(" ").trim();
  if (c.business_name && personal) return `${c.business_name} — ${personal}`;
  return c.business_name || personal || "Unnamed";
}

export function ClientPicker({ clients, onPick }: Props) {
  if (clients.length === 0) return null;
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
      <select
        className="gf-input"
        defaultValue=""
        style={{ appearance: "auto" }}
        onChange={(e) => {
          const c = clients.find((x) => x.id === e.target.value);
          if (!c) return;
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
          e.currentTarget.value = "";
        }}
      >
        <option value="">Select an existing client…</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {clientLabel(c)}
          </option>
        ))}
      </select>
    </div>
  );
}
