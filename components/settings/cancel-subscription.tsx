"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Props = { periodEnd: string | null };

export function CancelSubscription({ periodEnd }: Props) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onCancel = async () => {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setPending(false);
        return;
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className="gf-btn-link"
        onClick={() => setConfirming(true)}
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p
        className="gf-mono-sm"
        style={{ color: "var(--fg-3)", margin: 0 }}
      >
        You&apos;ll keep access until{" "}
        {periodEnd
          ? new Date(periodEnd).toLocaleDateString("en-GB", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "the period ends"}
        . Sure?
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="gf-btn"
          onClick={onCancel}
          disabled={pending}
        >
          {pending ? "Cancelling…" : "Confirm cancel"}
        </button>
        <button
          type="button"
          className="gf-btn gf-btn-ghost"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Keep subscription
        </button>
      </div>
      {error ? (
        <p
          className="gf-mono-sm"
          style={{ color: "var(--sev-red)", margin: 0 }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
