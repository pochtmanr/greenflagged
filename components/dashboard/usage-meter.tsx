type Props = {
  scans: number;
  drafts: number;
  scanLimit?: number;
  draftLimit?: number;
};

export function UsageMeter({
  scans,
  drafts,
  scanLimit = 1,
  draftLimit = 1,
}: Props) {
  return (
    <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
          Free tier
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="gf-specrow">
          <span className="key">Scans</span>
          <span className="dots" aria-hidden />
          <span className="val">
            {scans} / {scanLimit}
          </span>
        </div>
        <div className="gf-specrow">
          <span className="key">Drafts</span>
          <span className="dots" aria-hidden />
          <span className="val">
            {drafts} / {draftLimit}
          </span>
        </div>
      </div>
    </div>
  );
}
