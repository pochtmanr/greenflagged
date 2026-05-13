"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClientForm } from "@/components/settings/client-form";

type Client = {
  id: string;
  first_name: string;
  family_name: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string;
  city: string;
  street: string;
  postal_code: string;
  notes: string | null;
  is_default: boolean;
};

type Mode =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "edit"; id: string };

export function ClientsManager({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>({ kind: "list" });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const setDefault = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string, label: string) => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  };

  if (mode.kind === "new") {
    return (
      <div className="gf-frame">
        <span className="gf-frame-bl" aria-hidden />
        <span className="gf-frame-br" aria-hidden />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 className="gf-h4" style={{ margin: 0 }}>
            New client
          </h2>
        </div>
        <ClientForm
          onDone={() => setMode({ kind: "list" })}
          onCancel={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  if (mode.kind === "edit") {
    const client = clients.find((c) => c.id === mode.id);
    if (!client) {
      return (
        <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
          Client not found.
        </p>
      );
    }
    return (
      <div className="gf-frame">
        <span className="gf-frame-bl" aria-hidden />
        <span className="gf-frame-br" aria-hidden />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 className="gf-h4" style={{ margin: 0 }}>
            Edit client
          </h2>
        </div>
        <ClientForm
          initial={client}
          onDone={() => setMode({ kind: "list" })}
          onCancel={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <button
          type="button"
          className="gf-btn"
          onClick={() => setMode({ kind: "new" })}
        >
          + New client
        </button>
      </div>

      {error ? (
        <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
          {error}
        </p>
      ) : null}

      {clients.length === 0 ? (
        <div className="gf-card">
          <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
            No saved clients yet. Add one to skip retyping addresses in every
            contract.
          </p>
        </div>
      ) : (
        clients.map((c) => (
          <ClientCard
            key={c.id}
            client={c}
            busy={busyId === c.id}
            onEdit={() => setMode({ kind: "edit", id: c.id })}
            onSetDefault={() => setDefault(c.id)}
            onDelete={() =>
              remove(
                c.id,
                c.business_name ||
                  `${c.first_name} ${c.family_name}`.trim() ||
                  "this client",
              )
            }
          />
        ))
      )}
    </div>
  );
}

function ClientCard({
  client,
  busy,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  client: Client;
  busy: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const personName = `${client.first_name} ${client.family_name}`.trim();
  const headline = client.business_name || personName || "Untitled client";

  const addressLine = [
    client.street,
    client.postal_code,
    client.city,
    client.country_code,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="gf-frame"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <span className="gf-frame-bl" aria-hidden />
      <span className="gf-frame-br" aria-hidden />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h3 className="gf-h4" style={{ margin: 0 }}>
            {headline}
          </h3>
          {client.is_default ? (
            <span className="gf-tag sev-green">DEFAULT</span>
          ) : null}
        </div>
        {client.business_name && personName ? (
          <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
            {personName}
          </span>
        ) : null}
        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          {addressLine}
        </span>
        {client.email ? (
          <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
            {client.email}
          </span>
        ) : null}
        {client.notes ? (
          <p
            className="gf-body-sm"
            style={{ color: "var(--fg-2)", margin: "6px 0 0" }}
          >
            {client.notes}
          </p>
        ) : null}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="gf-btn-ghost"
          onClick={onEdit}
          disabled={busy}
        >
          Edit
        </button>
        {!client.is_default ? (
          <button
            type="button"
            className="gf-btn-ghost"
            onClick={onSetDefault}
            disabled={busy}
          >
            Set default
          </button>
        ) : null}
        <button
          type="button"
          className="gf-btn-ghost"
          onClick={onDelete}
          disabled={busy}
          style={{ color: "var(--sev-red)", borderColor: "var(--sev-red)" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
