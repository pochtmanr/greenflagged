"use client";

import * as React from "react";
import Link from "next/link";
import type {
  Accent,
  ContractStyle,
  Layout,
  LogoPlacement,
  Typography,
} from "@/lib/pdf/themes";

export type StyleSidebarProfile = {
  id: string;
  label: string;
  has_logo: boolean;
  is_default: boolean;
};

type Props = {
  value: ContractStyle;
  onChange: (next: ContractStyle) => void;
  profiles: StyleSidebarProfile[];
  selectedProfileId: string | null;
  onProfileChange: (id: string | null) => void;
};

export function StyleSidebar({
  value,
  onChange,
  profiles,
  selectedProfileId,
  onProfileChange,
}: Props) {
  return (
    <>
      <div
        className="gf-card"
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <span className="gf-label">// STYLE</span>
        <StyleSection
          label="Typography"
          value={value.typography}
          options={[
            { value: "editorial", label: "Editorial" },
            { value: "modern", label: "Modern" },
            { value: "classic", label: "Classic" },
          ]}
          onChange={(v) =>
            onChange({ ...value, typography: v as Typography })
          }
        />
        <StyleSection
          label="Color accent"
          value={value.accent}
          options={[
            { value: "sage", label: "Sage" },
            { value: "ink", label: "Ink" },
            { value: "brand", label: "Brand" },
          ]}
          onChange={(v) => onChange({ ...value, accent: v as Accent })}
        />
        {value.accent === "brand" ? (
          <label className="style-sidebar__field">
            <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
              Brand color
            </span>
            <input
              type="color"
              value={value.brand_color ?? "#4A7A5C"}
              onChange={(e) =>
                onChange({ ...value, brand_color: e.target.value })
              }
              className="style-sidebar__color"
            />
          </label>
        ) : null}
        <StyleSection
          label="Layout"
          value={value.layout}
          options={[
            { value: "single", label: "Single" },
            { value: "two-column", label: "Two-col" },
            { value: "cover", label: "Cover" },
          ]}
          onChange={(v) => onChange({ ...value, layout: v as Layout })}
        />
        <StyleSection
          label="Logo placement"
          value={value.logo_placement}
          options={[
            { value: "header", label: "Header" },
            { value: "footer", label: "Footer" },
            { value: "cover", label: "Cover" },
            { value: "none", label: "None" },
          ]}
          onChange={(v) =>
            onChange({ ...value, logo_placement: v as LogoPlacement })
          }
        />
      </div>

      <div
        className="gf-card"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <span className="gf-label">// BUSINESS PROFILE</span>
        <select
          className="gf-input"
          value={selectedProfileId ?? ""}
          onChange={(e) => onProfileChange(e.target.value || null)}
          style={{ appearance: "auto" }}
        >
          <option value="">— None —</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
              {p.is_default ? " · default" : ""}
              {p.has_logo ? " · logo" : ""}
            </option>
          ))}
        </select>
        <Link href="/settings/business" className="gf-btn-link">
          Manage profiles →
        </Link>
      </div>

      <StyleSidebarStyles />
    </>
  );
}

type StyleSectionProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

function StyleSection<T extends string>({
  label,
  value,
  options,
  onChange,
}: StyleSectionProps<T>) {
  return (
    <div className="style-sidebar__radio-group">
      <span className="gf-mono-sm" style={{ color: "var(--fg-3)" }}>
        {label}
      </span>
      <div className="style-sidebar__radio-row">
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              className={
                "style-sidebar__radio" + (isActive ? " is-active" : "")
              }
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StyleSidebarStyles() {
  return (
    <style>{`
      .style-sidebar__radio-group { display: flex; flex-direction: column; gap: 6px; }
      .style-sidebar__radio-row { display: flex; gap: 4px; flex-wrap: wrap; }
      .style-sidebar__radio {
        font-family: var(--font-mono);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 6px 10px;
        background: var(--surface);
        border: 1px solid var(--rule);
        color: var(--fg-2);
        cursor: pointer;
        transition: color 120ms, border-color 120ms, background 120ms;
      }
      .style-sidebar__radio:hover {
        color: var(--fg-1);
        border-color: var(--rule-strong);
      }
      .style-sidebar__radio.is-active {
        color: var(--accent-strong);
        border-color: var(--accent-strong);
        background: var(--accent-tint);
      }
      .style-sidebar__field {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: space-between;
      }
      .style-sidebar__color {
        width: 32px;
        height: 32px;
        border: 1px solid var(--rule);
        background: transparent;
        padding: 0;
      }
    `}</style>
  );
}
