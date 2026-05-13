"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";
import { INDUSTRIES } from "@/lib/industries";
import { updateProfile } from "@/app/(app)/settings/actions";

type AccountType = "solo" | "freelancer" | "business";

type Props = {
  initialAccountType: AccountType;
  initialCountry: string;
  initialBusinessName: string;
  initialIndustries: string[];
};

export function ProfileForm({
  initialAccountType,
  initialCountry,
  initialBusinessName,
  initialIndustries,
}: Props) {
  const [accountType, setAccountType] = React.useState<AccountType>(initialAccountType);
  const [country, setCountry] = React.useState(initialCountry);
  const [businessName, setBusinessName] = React.useState(initialBusinessName);
  const [industries, setIndustries] = React.useState<string[]>(initialIndustries);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  const toggleIndustry = (slug: string) => {
    setIndustries((curr) =>
      curr.includes(slug) ? curr.filter((s) => s !== slug) : [...curr, slug]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const result = await updateProfile({
      account_type: accountType,
      country_code: country,
      industries,
      business_name: accountType === "business" ? businessName : null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSavedAt(Date.now());
  };

  return (
    <form
      onSubmit={onSubmit}
      className="gf-card"
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
    >
      <h3 className="gf-h4">Profile</h3>

      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="gf-label">// ACCOUNT TYPE</span>
        <select
          required
          className="gf-input"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value as AccountType)}
        >
          <option value="solo">Solo</option>
          <option value="freelancer">Freelancer</option>
          <option value="business">Business</option>
        </select>
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="gf-label">// INDUSTRIES</span>
        <div
          role="group"
          aria-label="Industries"
          style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
        >
          {INDUSTRIES.map((ind) => {
            const active = industries.includes(ind.slug);
            return (
              <button
                key={ind.slug}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => toggleIndustry(ind.slug)}
                className="gf-tag"
                style={{
                  cursor: "pointer",
                  background: active ? "var(--ink-500)" : "transparent",
                  color: active ? "var(--paper-0)" : "var(--fg-2)",
                  borderColor: active ? "var(--ink-500)" : "var(--rule)",
                }}
              >
                {ind.label}
              </button>
            );
          })}
        </div>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span className="gf-label">// COUNTRY</span>
        <select
          required
          className="gf-input"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {accountType === "business" ? (
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="gf-label">// BUSINESS NAME</span>
          <Input
            required
            type="text"
            autoComplete="organization"
            placeholder="Acme Inc."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            maxLength={120}
          />
        </label>
      ) : null}

      {error ? (
        <p className="gf-mono-sm" style={{ color: "var(--sev-red)" }}>
          {error}
        </p>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <button type="submit" className="gf-btn" disabled={saving || industries.length === 0}>
          {saving ? (
            <>
              <Loader2 width={14} height={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              Save changes <span className="arrow">→</span>
            </>
          )}
        </button>
        {savedAt ? (
          <span className="gf-mono-sm" style={{ color: "var(--accent-strong)" }}>
            Saved.
          </span>
        ) : null}
      </div>
    </form>
  );
}
