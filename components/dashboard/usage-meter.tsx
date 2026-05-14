type Props = {
  contracts: number;
  contractLimit?: number;
  planLabel?: string;
};

function fmtRow(used: number, limit: number): string {
  if (!Number.isFinite(limit)) return `${used} · Unlimited`;
  return `${used} / ${limit}`;
}

export function UsageMeter({
  contracts,
  contractLimit = 1,
  planLabel = "Free tier",
}: Props) {
  return (
    <div
      className="gf-card"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <h3 className="gf-h4">Usage this month</h3>
        <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
          {planLabel}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="gf-specrow">
          <span className="key">Contracts</span>
          <span className="dots" aria-hidden />
          <span className="val">{fmtRow(contracts, contractLimit)}</span>
        </div>
      </div>
    </div>
  );
}
