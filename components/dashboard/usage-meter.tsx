type Props = {
  scans: number;
  drafts: number;
  scanLimit?: number;
  draftLimit?: number;
  planLabel?: string;
};

function fmtRow(used: number, limit: number): string {
  if (!Number.isFinite(limit)) return `${used} · Unlimited`;
  return `${used} / ${limit}`;
}

export function UsageMeter({
  scans,
  drafts,
  scanLimit = 1,
  draftLimit = Number.POSITIVE_INFINITY,
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
          <span className="key">Scans</span>
          <span className="dots" aria-hidden />
          <span className="val">{fmtRow(scans, scanLimit)}</span>
        </div>
        <div className="gf-specrow">
          <span className="key">Drafts</span>
          <span className="dots" aria-hidden />
          <span className="val">{fmtRow(drafts, draftLimit)}</span>
        </div>
      </div>
    </div>
  );
}
