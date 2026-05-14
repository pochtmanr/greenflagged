import * as React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
  Link,
} from "@react-pdf/renderer";
import type { Block, Inline } from "./parse";
import { parseInline, parseMarkdown, splitForTwoColumns } from "./parse";
import type { ContractStyle, ResolvedStyle } from "./themes";
import { resolveStyle } from "./themes";

export type BusinessFields = {
  business_name?: string | null;
  first_name?: string | null;
  family_name?: string | null;
  address_line?: string | null;
};

export type ThemedPdfArgs = {
  body_md: string;
  title: string;
  style: ContractStyle;
  logo_data_url?: string;
  business?: BusinessFields;
};

export const PAGE_MARGIN_X = 56;
export const PAGE_MARGIN_Y = 56;

export function pageStyle(s: ResolvedStyle) {
  return StyleSheet.create({
    page: {
      paddingTop: PAGE_MARGIN_Y,
      paddingBottom: PAGE_MARGIN_Y,
      paddingHorizontal: PAGE_MARGIN_X,
      fontSize: 11,
      fontFamily: s.fonts.body,
      color: s.colors.ink,
      lineHeight: 1.55,
    },
  }).page;
}

export function blockStyles(s: ResolvedStyle) {
  return StyleSheet.create({
    h1: {
      fontSize: 22,
      fontFamily: s.fonts.heading,
      color: s.colors.ink,
      marginBottom: 6,
    },
    h2: {
      fontSize: 13,
      fontFamily: s.fonts.heading,
      color: s.colors.accent,
      marginTop: 16,
      marginBottom: 6,
    },
    h3: {
      fontSize: 11.5,
      fontFamily: s.fonts.heading,
      color: s.colors.ink,
      marginTop: 12,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 11,
      fontFamily: s.fonts.bodyItalic,
      color: s.colors.muted,
      marginBottom: 14,
    },
    para: { marginBottom: 8 },
    bullet: { flexDirection: "row", marginBottom: 4 },
    bulletDot: { width: 18, color: s.colors.accent, fontFamily: s.fonts.bodyBold },
    bulletBody: { flex: 1 },
    hr: {
      borderBottomWidth: 1,
      borderBottomColor: s.colors.rule,
      marginVertical: 14,
    },
    footer: {
      marginTop: 14,
      fontSize: 9,
      color: s.colors.muted,
      fontFamily: s.fonts.bodyItalic,
    },
    col: { flex: 1 },
    cols: { flexDirection: "row", gap: 24 },
  });
}

export function InlineText({
  value,
  resolved,
}: {
  value: string;
  resolved: ResolvedStyle;
}) {
  const segs = parseInline(value);
  return (
    <>
      {segs.map((seg, i) => renderInline(seg, i, resolved))}
    </>
  );
}

function renderInline(seg: Inline, key: number, resolved: ResolvedStyle): React.ReactNode {
  if (seg.kind === "bold") {
    return (
      <Text key={key} style={{ fontFamily: resolved.fonts.bodyBold }}>
        {seg.text}
      </Text>
    );
  }
  if (seg.kind === "italic") {
    return (
      <Text key={key} style={{ fontFamily: resolved.fonts.bodyItalic }}>
        {seg.text}
      </Text>
    );
  }
  if (seg.kind === "link") {
    return (
      <Link
        key={key}
        src={seg.href}
        style={{ color: resolved.colors.accent, textDecoration: "underline" }}
      >
        {seg.text}
      </Link>
    );
  }
  return <Text key={key}>{seg.text}</Text>;
}

export function renderBlock(
  block: Block,
  index: number,
  resolved: ResolvedStyle,
  styles: ReturnType<typeof blockStyles>,
  blocks: Block[],
): React.ReactNode {
  if (block.kind === "h1") {
    return (
      <Text key={index} style={styles.h1}>
        {block.text}
      </Text>
    );
  }
  if (block.kind === "subtitle") {
    return (
      <Text key={index} style={styles.subtitle}>
        {block.text}
      </Text>
    );
  }
  if (block.kind === "h2") {
    return (
      <Text key={index} style={styles.h2}>
        {block.text}
      </Text>
    );
  }
  if (block.kind === "h3") {
    return (
      <Text key={index} style={styles.h3}>
        {block.text}
      </Text>
    );
  }
  if (block.kind === "p") {
    return (
      <Text key={index} style={styles.para}>
        <InlineText value={block.text} resolved={resolved} />
      </Text>
    );
  }
  if (block.kind === "ol") {
    return (
      <View key={index} style={{ marginBottom: 8 }}>
        {block.items.map((item, idx) => (
          <View key={idx} style={styles.bullet}>
            <Text style={styles.bulletDot}>{`${idx + 1}.`}</Text>
            <Text style={styles.bulletBody}>
              <InlineText value={item} resolved={resolved} />
            </Text>
          </View>
        ))}
      </View>
    );
  }
  if (block.kind === "ul") {
    return (
      <View key={index} style={{ marginBottom: 8 }}>
        {block.items.map((item, idx) => (
          <View key={idx} style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletBody}>
              <InlineText value={item} resolved={resolved} />
            </Text>
          </View>
        ))}
      </View>
    );
  }
  if (block.kind === "hr") {
    return <View key={index} style={styles.hr} />;
  }
  if (block.kind === "footer") {
    return (
      <Text key={index} style={styles.footer}>
        {block.text}
      </Text>
    );
  }
  // Exhaustiveness guard
  void blocks;
  return null;
}

function HeaderLogo({ url }: { url: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 }}>
      <Image src={url} style={{ height: 28, maxWidth: 120, objectFit: "contain" }} />
    </View>
  );
}

function FooterLogo({ url }: { url: string }) {
  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 24,
        left: 0,
        right: 0,
        alignItems: "center",
      }}
    >
      <Image src={url} style={{ height: 20, maxWidth: 100, objectFit: "contain" }} />
    </View>
  );
}

function CoverPage({
  title,
  business,
  resolved,
  logoUrl,
}: {
  title: string;
  business?: BusinessFields;
  resolved: ResolvedStyle;
  logoUrl?: string;
}) {
  const styles = StyleSheet.create({
    page: {
      paddingTop: 96,
      paddingBottom: 64,
      paddingHorizontal: 64,
      fontFamily: resolved.fonts.body,
      color: resolved.colors.ink,
      alignItems: "center",
      justifyContent: "center",
    },
    eyebrow: {
      fontFamily: resolved.fonts.mono,
      fontSize: 10,
      color: resolved.colors.accent,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 24,
    },
    title: {
      fontSize: 36,
      fontFamily: resolved.fonts.heading,
      color: resolved.colors.ink,
      textAlign: "center",
      marginBottom: 16,
    },
    party: {
      fontSize: 13,
      color: resolved.colors.ink,
      textAlign: "center",
      marginBottom: 4,
      fontFamily: resolved.fonts.body,
    },
    address: {
      fontSize: 11,
      color: resolved.colors.muted,
      textAlign: "center",
      marginBottom: 4,
      fontFamily: resolved.fonts.body,
    },
    date: {
      marginTop: 32,
      fontSize: 11,
      color: resolved.colors.muted,
      fontFamily: resolved.fonts.mono,
    },
    accentRule: {
      width: 64,
      height: 2,
      backgroundColor: resolved.colors.accent,
      marginVertical: 24,
    },
  });

  const partyName =
    business?.business_name ||
    [business?.first_name, business?.family_name].filter(Boolean).join(" ") ||
    "";

  return (
    <Page size="A4" style={styles.page}>
      {logoUrl ? (
        <Image src={logoUrl} style={{ height: 48, maxWidth: 200, objectFit: "contain", marginBottom: 32 }} />
      ) : null}
      <Text style={styles.eyebrow}>// CONTRACT</Text>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.accentRule} />
      {partyName ? <Text style={styles.party}>{partyName}</Text> : null}
      {business?.address_line ? (
        <Text style={styles.address}>{business.address_line}</Text>
      ) : null}
      <Text style={styles.date}>{formatDate(new Date())}</Text>
    </Page>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function renderContractPdf(args: ThemedPdfArgs): Promise<Buffer> {
  const resolved = resolveStyle(args.style);
  const styles = blockStyles(resolved);
  const allBlocks = parseMarkdown(args.body_md);

  // h1 is rendered as title; skip from body to avoid duplication
  const titleBlock = allBlocks.find((b) => b.kind === "h1");
  const bodyBlocks = allBlocks.filter((b) => b !== titleBlock);

  const showCover =
    resolved.layout === "cover" || resolved.logo_placement === "cover";
  const headerLogo =
    resolved.logo_placement === "header" && args.logo_data_url
      ? args.logo_data_url
      : undefined;
  const footerLogo =
    resolved.logo_placement === "footer" && args.logo_data_url
      ? args.logo_data_url
      : undefined;
  const coverLogo =
    showCover && resolved.logo_placement !== "footer" && resolved.logo_placement !== "none"
      ? args.logo_data_url
      : undefined;

  const useTwoCols = resolved.layout === "two-column";
  const [colA, colB] = useTwoCols
    ? splitForTwoColumns(bodyBlocks)
    : [bodyBlocks, [] as Block[]];

  const doc = (
    <Document title={args.title}>
      {showCover ? (
        <CoverPage
          title={args.title}
          business={args.business}
          resolved={resolved}
          logoUrl={coverLogo}
        />
      ) : null}
      <Page size="A4" style={pageStyle(resolved)}>
        {headerLogo ? <HeaderLogo url={headerLogo} /> : null}
        {!showCover ? (
          <Text style={styles.h1}>{args.title}</Text>
        ) : null}

        {useTwoCols ? (
          <View style={styles.cols}>
            <View style={styles.col}>
              {colA.map((b, i) => renderBlock(b, i, resolved, styles, colA))}
            </View>
            <View style={styles.col}>
              {colB.map((b, i) => renderBlock(b, i, resolved, styles, colB))}
            </View>
          </View>
        ) : (
          <View>
            {bodyBlocks.map((b, i) => renderBlock(b, i, resolved, styles, bodyBlocks))}
          </View>
        )}

        {footerLogo ? <FooterLogo url={footerLogo} /> : null}
      </Page>
    </Document>
  );

  const data = await renderToBuffer(doc);
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(data as unknown as Uint8Array);
}
