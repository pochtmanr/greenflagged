"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import { resolveStyle, type ContractStyle } from "@/lib/pdf/themes";

type Props = {
  body_md: string;
  title: string;
  style: ContractStyle;
  logoSrc?: string | null;
  businessName?: string | null;
};

const FONT_STACKS: Record<ContractStyle["typography"], { heading: string; body: string }> = {
  editorial: {
    heading: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
    body: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  modern: {
    heading: '"Arial", "Helvetica", sans-serif',
    body: '"Arial", "Helvetica", sans-serif',
  },
  classic: {
    heading: '"Times New Roman", Times, serif',
    body: '"Times New Roman", Times, serif',
  },
};

export function StyledMarkdown({
  body_md,
  title,
  style,
  logoSrc,
  businessName,
}: Props) {
  const resolved = resolveStyle(style);
  const fonts = FONT_STACKS[style.typography];
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
  const logoNode = showLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoSrc ?? undefined} alt={businessName ?? "Logo"} className="doc-logo" />
  ) : null;

  if (style.layout === "cover") {
    return (
      <div className={classNames} style={cssVars}>
        <div className="doc-preview__cover">
          {style.logo_placement === "cover" && logoNode}
          <h1 className="doc-preview__cover-title">{title}</h1>
          {businessName ? (
            <p className="doc-preview__cover-sub">{businessName}</p>
          ) : null}
        </div>
        <hr />
        {style.logo_placement === "header" && logoNode}
        <div className="doc-preview__body">
          <ReactMarkdown>{body_md}</ReactMarkdown>
        </div>
        {style.logo_placement === "footer" && (
          <div className="doc-preview__footer">{logoNode}</div>
        )}
      </div>
    );
  }

  return (
    <div className={classNames} style={cssVars}>
      {style.logo_placement === "header" && logoNode}
      {style.logo_placement === "cover" && logoNode}
      <div className="doc-preview__body">
        <ReactMarkdown>{body_md}</ReactMarkdown>
      </div>
      {style.logo_placement === "footer" && (
        <div className="doc-preview__footer">{logoNode}</div>
      )}
    </div>
  );
}
