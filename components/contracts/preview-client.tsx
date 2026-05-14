"use client";

import * as React from "react";
import { Dropdown } from "@/components/ui/dropdown";
import { LOCALE_OPTIONS, type Locale } from "@/lib/contracts/i18n";
import type { ContractStyle } from "@/lib/pdf/themes";
import { StyledMarkdown } from "./styled-markdown";

type Props = {
  contractId: string;
  title: string;
  bodyMd: string;
  translations: Record<string, string>;
  style: ContractStyle;
  businessName: string | null;
  businessAddress: string | null;
  logoSrc: string | null;
};

export function PreviewClient({
  contractId,
  title,
  bodyMd,
  translations,
  style,
  businessName,
  businessAddress,
  logoSrc,
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

  const localeQuery = locale === "en" ? "" : `?locale=${locale}`;
  const pdfHref = `/api/contracts/${contractId}/pdf${localeQuery}`;
  const pdfDownloadHref = `/api/contracts/${contractId}/pdf?download=1${
    locale === "en" ? "" : `&locale=${locale}`
  }`;
  const docxDownloadHref = `/api/contracts/${contractId}/docx${localeQuery}`;
  const canDownload = previewBody !== null;

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
              This language isn&apos;t translated yet. Open the editor and click{" "}
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
          <span className="gf-label">{"// LANGUAGE"}</span>
          <Dropdown
            value={locale}
            onChange={(v) => setLocale(v as Locale)}
            options={localeOptions}
            placeholder="Language"
            aria-label="Preview language"
          />
          <p
            className="gf-mono-sm"
            style={{ color: "var(--fg-3)", margin: 0, fontSize: 11 }}
          >
            Downloads and print use this language.
          </p>
        </div>

        <div
          className="gf-card"
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
        >
          <span className="gf-label">{"// DOWNLOAD"}</span>
          {canDownload ? (
            <>
              <a
                href={pdfDownloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="gf-btn"
              >
                Download PDF <span className="arrow">→</span>
              </a>
              <a
                href={docxDownloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="gf-btn"
              >
                Download DOCX <span className="arrow">→</span>
              </a>
              <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="gf-btn-accent-soft"
              >
                Open / Print PDF
              </a>
            </>
          ) : (
            <p
              className="gf-mono-sm"
              style={{ color: "var(--fg-3)", margin: 0 }}
            >
              Translate this language to enable downloads.
            </p>
          )}
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
