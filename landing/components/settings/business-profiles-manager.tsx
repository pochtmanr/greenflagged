"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";

type Profile = {
  id: string;
  label: string | null;
  first_name: string;
  family_name: string;
  business_name: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country_code: string;
  city: string;
  street: string;
  postal_code: string;
  is_default: boolean;
  logo_path: string | null;
  logo_url: string | null;
};

type Mode =
  | { kind: "list" }
  | { kind: "new" }
  | { kind: "edit"; id: string };

export function BusinessProfilesManager({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>({ kind: "list" });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const setDefault = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/business-profiles/${id}`, {
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
      const res = await fetch(`/api/business-profiles/${id}`, {
        method: "DELETE",
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
            New business profile
          </h2>
        </div>
        <BusinessProfileForm
          onDone={() => setMode({ kind: "list" })}
          onCancel={() => setMode({ kind: "list" })}
        />
      </div>
    );
  }

  if (mode.kind === "edit") {
    const profile = profiles.find((p) => p.id === mode.id);
    if (!profile) {
      return (
        <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
          Profile not found.
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
            Edit profile
          </h2>
        </div>
        <BusinessProfileForm
          initial={profile}
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
          + New profile
        </button>
      </div>

      {error ? (
        <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
          {error}
        </p>
      ) : null}

      {profiles.length === 0 ? (
        <div className="gf-card">
          <p className="gf-body-sm" style={{ color: "var(--fg-3)" }}>
            No business profiles yet. Create one to pre-fill your provider
            details in new contracts.
          </p>
        </div>
      ) : (
        profiles.map((p) => (
          <ProfileCard
            key={p.id}
            profile={p}
            busy={busyId === p.id}
            onEdit={() => setMode({ kind: "edit", id: p.id })}
            onSetDefault={() => setDefault(p.id)}
            onDelete={() =>
              remove(
                p.id,
                p.label ||
                  p.business_name ||
                  `${p.first_name} ${p.family_name}`.trim() ||
                  "this profile",
              )
            }
          />
        ))
      )}
    </div>
  );
}

function ProfileCard({
  profile,
  busy,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  profile: Profile;
  busy: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const displayLabel =
    profile.label ||
    profile.business_name ||
    `${profile.first_name} ${profile.family_name}`.trim() ||
    "Untitled profile";

  const addressLine = [
    profile.street,
    profile.postal_code,
    profile.city,
    profile.country_code,
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

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            border: "1px solid var(--rule)",
            background: "var(--surface-elev)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {profile.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo_url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <span
              className="gf-mono-sm"
              style={{ color: "var(--fg-4)" }}
            >
              NO LOGO
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <h3 className="gf-h4" style={{ margin: 0 }}>
              {displayLabel}
            </h3>
            {profile.is_default ? (
              <span className="gf-tag sev-green">DEFAULT</span>
            ) : null}
          </div>
          {profile.business_name && profile.label ? (
            <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
              {profile.business_name}
            </span>
          ) : null}
          <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
            {addressLine}
          </span>
          {profile.tax_id ? (
            <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
              Tax ID: {profile.tax_id}
            </span>
          ) : null}
        </div>
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
        {!profile.is_default ? (
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
