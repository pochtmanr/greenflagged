"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function FixContractPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const contractId = params?.id ?? "";

  const [error, setError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    if (!contractId || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    (async () => {
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
        if (!data.contract_id) throw new Error("No contract id returned");
        if (!cancelled) router.replace(`/contracts/${data.contract_id}`);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to create fix");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contractId, router]);

  return (
    <section className="section" style={{ paddingTop: 96 }}>
      <div className="app-shell">
        <div
          className="content--prose"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 24,
            paddingBlock: 48,
          }}
        >
          <span className="gf-label" style={{ color: "var(--accent-strong)" }}>
            // {error ? "ERROR" : "GENERATING"}
          </span>

          {error ? (
            <ErrorBlock contractId={contractId} message={error} />
          ) : (
            <LoadingBlock />
          )}
        </div>
      </div>
    </section>
  );
}

function LoadingBlock() {
  return (
    <>
      <h1 className="gf-h2" style={{ margin: 0 }}>
        Creating your fixed version
      </h1>
      <p className="gf-body" style={{ color: "var(--fg-2)", maxWidth: 520, margin: 0 }}>
        Applying the suggested redlines to your contract. This usually takes
        20–40 seconds — keep this tab open.
      </p>

      <div
        aria-hidden
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginTop: 12,
        }}
      >
        <FixDot delay={0} />
        <FixDot delay={160} />
        <FixDot delay={320} />
      </div>

      <ul
        className="gf-mono-sm"
        style={{
          color: "var(--fg-3)",
          listStyle: "none",
          padding: 0,
          margin: "16px 0 0",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <li>// Reading original clauses</li>
        <li>// Applying redlines</li>
        <li>// Rebuilding the document</li>
      </ul>

      <style>{dotKeyframes}</style>
    </>
  );
}

function ErrorBlock({
  contractId,
  message,
}: {
  contractId: string;
  message: string;
}) {
  return (
    <>
      <h1 className="gf-h2" style={{ margin: 0 }}>
        We couldn’t create the fixed version
      </h1>
      <p
        className="gf-body"
        style={{ color: "var(--fg-2)", maxWidth: 520, margin: 0 }}
      >
        {message}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href={`/contracts/${contractId}`} className="gf-btn-ghost">
          ← Back to verdict
        </Link>
        <Link href={`/contracts/${contractId}/fix`} replace className="gf-btn">
          Try again
        </Link>
      </div>
    </>
  );
}

function FixDot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 9999,
        background: "var(--accent-strong)",
        animation: "fix-dot 1100ms ease-in-out infinite",
        animationDelay: `${delay}ms`,
        display: "inline-block",
      }}
    />
  );
}

const dotKeyframes = `
@keyframes fix-dot {
  0%, 100% { opacity: 0.25; transform: translateY(0); }
  50%      { opacity: 1;    transform: translateY(-4px); }
}
`;
