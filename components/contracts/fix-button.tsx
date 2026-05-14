"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

type Props = {
  contractId: string;
  disabled?: boolean;
};

export function FixButton({ contractId, disabled = false }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onClick() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/fix`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data && typeof data.error === "string" && data.error) ||
            `Request failed (${res.status})`,
        );
      }
      const data = (await res.json()) as { contract_id?: string };
      if (!data.contract_id) {
        throw new Error("No contract id returned");
      }
      router.push(`/contracts/${data.contract_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fix");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
      <button
        type="button"
        className="gf-btn-link"
        onClick={onClick}
        disabled={disabled || submitting}
      >
        {submitting ? "Creating fixed version…" : "Create fixed version"}{" "}
        <span className="arrow">→</span>
      </button>
      {error ? (
        <span
          className="gf-mono-sm"
          style={{ color: "var(--sev-red)", maxWidth: 320, textAlign: "right" }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
