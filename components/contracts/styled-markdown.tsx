"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import {
  DOC_PREVIEW_FONTS,
  resolveStyle,
  type ContractStyle,
} from "@/lib/pdf/themes";

type Props = {
  body_md: string;
  title: string;
  style: ContractStyle;
  logoSrc?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
};

export function StyledMarkdown({
  body_md,
  title,
  style,
  logoSrc,
  businessName,
  businessAddress,
}: Props) {
  const resolved = resolveStyle(style);
  const fonts = DOC_PREVIEW_FONTS[style.typography];
  const cssVars: React.CSSProperties = {
    "--doc-font-heading": fonts.heading,
    "--doc-font-body": fonts.body,
    "--doc-accent": resolved.colors.accent,
  } as React.CSSProperties;

  const classNames = [
    "doc-preview",
    `doc-preview--layout-${style.layout}`,
    `doc-preview--logo-${style.logo_placement}`,
  ].join(" ");

  const showLogo = style.logo_placement !== "none" && Boolean(logoSrc);
  const logoImg = logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoSrc} alt={businessName ?? "Logo"} className="doc-logo" />
  ) : null;

  // Header_with_info renders both logo (left) and company info (right).
  const headerWithInfo =
    style.logo_placement === "header_with_info" ? (
      <div className="doc-preview__head">
        <div className="doc-preview__head-logo">{logoImg}</div>
        <div className="doc-preview__head-info">
          {businessName ? <strong>{businessName}</strong> : null}
          {businessAddress ? <span>{businessAddress}</span> : null}
        </div>
      </div>
    ) : null;

  const plainHeaderLogo =
    style.logo_placement === "header" && showLogo ? logoImg : null;

  if (style.layout === "cover") {
    return (
      <div className={classNames} style={cssVars}>
        <div className="doc-preview__cover">
          {style.logo_placement === "cover" && logoImg}
          <h1 className="doc-preview__cover-title">{title}</h1>
          {businessName ? (
            <p className="doc-preview__cover-sub">{businessName}</p>
          ) : null}
        </div>
        <hr />
        {plainHeaderLogo}
        {headerWithInfo}
        <div className="doc-preview__body">
          <ReactMarkdown>{body_md}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames} style={cssVars}>
      {plainHeaderLogo}
      {headerWithInfo}
      <div className="doc-preview__body">
        <ReactMarkdown>{body_md}</ReactMarkdown>
      </div>
    </div>
  );
}
