"use client";

import * as React from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { LOCALE_OPTIONS, type Locale } from "@/lib/contracts/i18n";
import type { ContractStyle } from "@/lib/pdf/themes";
import { StyledMarkdown } from "./styled-markdown";

type Props = {
  title: string;
  bodyMd: string;
  translations: Record<string, string>;
  style: ContractStyle;
  businessName: string | null;
  businessAddress: string | null;
  logoSrc: string | null;
  pdfHref: string;
};

export function PreviewClient({
  title,
  bodyMd,
  translations,
  style,
  businessName,
  businessAddress,
  logoSrc,
  pdfHref,
}: Props) {
  const [locale, setLocale] = React.useState<Locale>("en");

  const previewBody =
    locale === "en"
      ? bodyMd
      : translations[locale]?.trim()?.length
        ? translations[locale]
        : null;

  const localeOptions = LOCALE_OPTIONS.map((o) => ({
    ...o,
    hint:
      o.value === "en"
        ? "Source"
        : translations[o.value]
          ? undefined
          : "Not translated",
    disabled: o.value !== "en" && !translations[o.value],
  }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 280px",
        gap: 24,
        alignItems: "start",
      }}
      className="preview-grid"
    >
      <div style={{ minWidth: 0 }}>
        {previewBody ? (
          <StyledMarkdown
            body_md={previewBody}
            title={title}
            style={style}
            logoSrc={logoSrc}
            businessName={businessName}
            businessAddress={businessAddress}
          />
        ) : (
          <div className="gf-card">
            <p className="gf-body" style={{ color: "var(--fg-2)", margin: 0 }}>
              This language isn't translated yet. Open the editor and click{" "}
              <strong>Translate with AI</strong> for {locale.toUpperCase()}.
            </p>
          </div>
        )}
      </div>

      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "sticky",
          top: 96,
        }}
      >
        <div
          className="gf-card"
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <span className="gf-label">// LANGUAGE</span>
          <Dropdown
            value={locale}
            onChange={(v) => setLocale(v as Locale)}
            options={localeOptions}
            placeholder="Language"
            aria-label="Preview language"
          />
        </div>
        <div
          className="gf-card"
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="gf-btn"
          >
            Open PDF <span className="arrow">→</span>
          </a>
          <a
            href={`${pdfHref}?download=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="gf-btn-ghost"
          >
            Download PDF
          </a>
        </div>
      </aside>

      <style>{`
        @media (max-width: 980px) {
          .preview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
