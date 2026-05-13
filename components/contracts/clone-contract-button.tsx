"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Props = {
  contractId: string;
};

export function CloneContractButton({ contractId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/clone`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Clone failed (${res.status})`);
      }
      const data = (await res.json()) as { contract_id: string };
      router.push(`/contracts/${data.contract_id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        className="gf-btn-ghost"
        onClick={onClick}
        disabled={busy}
      >
        {busy ? "Cloning…" : "Clone as template"}
      </button>
      {error ? (
        <span className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
