import type { UsageEventKind } from "@/lib/supabase/types";

type Row = {
  id: number;
  kind: UsageEventKind;
  created_at: string;
};

type Props = {
  events: Row[];
};

const LABEL: Record<UsageEventKind, string> = {
  scan: "Scan",
  draft: "Draft",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityFeed({ events }: Props) {
  return (
    <div className="gf-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 className="gf-h4">Recent activity</h3>
      {events.length === 0 ? (
        <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
          Activity will appear here once you start using Green Flagged.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.map((e) => (
            <div key={e.id} className="gf-specrow">
              <span className="key">{LABEL[e.kind]}</span>
              <span className="dots" aria-hidden />
              <span className="val">{formatWhen(e.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
