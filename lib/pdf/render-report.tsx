import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Redline, TaxonomyEntry } from "@/lib/ai/review";
import type { VerdictSeverity } from "@/lib/supabase/types";
import { parseMarkdown } from "./parse";
import { blockStyles, pageStyle, renderBlock } from "./render-themed";
import type { ContractStyle } from "./themes";
import { resolveStyle } from "./themes";

const SEV_COLORS: Record<VerdictSeverity, string> = {
  green: "#4A7A5C",
  yellow: "#FFD600",
  orange: "#FF8A1F",
  red: "#FF3D5C",
};

const SEV_LABELS: Record<VerdictSeverity, string> = {
  green: "GREEN FLAGGED",
  yellow: "MINOR ISSUES",
  orange: "RED FLAGS",
  red: "DO NOT SIGN",
};

const SEV_SHORT: Record<VerdictSeverity, string> = {
  green: "OK",
  yellow: "WARN",
  orange: "HIGH",
  red: "CRITICAL",
};

const TAXONOMY_LABELS: Record<string, string> = {
  ip_ownership: "IP ownership",
  payment_terms: "Payment terms",
  termination: "Termination",
  nda_scope: "NDA scope",
  liability_cap: "Liability cap",
  jurisdiction: "Jurisdiction",
  auto_renewal: "Auto-renewal",
  kill_fees: "Kill fees",
  exclusivity: "Exclusivity",
};

const SEV_RANK: Record<VerdictSeverity, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
  green: 3,
};

export type ReportPdfArgs = {
  title: string;
  severity: VerdictSeverity;
  reviewedAt: string;
  verdictMd: string;
  taxonomy: Record<string, TaxonomyEntry>;
  redlines: Redline[];
  style: ContractStyle;
  logoDataUrl?: string;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function tintFor(sev: VerdictSeverity): string {
  // Light backdrop for tag chips — rgba-equivalent at ~14% opacity.
  switch (sev) {
    case "green":
      return "#E4EDE7";
    case "yellow":
      return "#FFF6CC";
    case "orange":
      return "#FFE1C6";
    case "red":
      return "#FFD7DD";
  }
}

export async function renderReportPdf(args: ReportPdfArgs): Promise<Buffer> {
  const resolved = resolveStyle(args.style);
  const styles = blockStyles(resolved);
  const verdictBlocks = parseMarkdown(args.verdictMd ?? "");

  const sortedRedlines = [...(args.redlines ?? [])].sort(
    (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity],
  );

  const taxonomyRows = Object.entries(TAXONOMY_LABELS).map(([key, label]) => {
    const entry = args.taxonomy?.[key];
    return { key, label, entry };
  });

  const sevColor = SEV_COLORS[args.severity];

  const cover = StyleSheet.create({
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
      fontSize: 32,
      fontFamily: resolved.fonts.heading,
      color: resolved.colors.ink,
      textAlign: "center",
      marginBottom: 24,
    },
    stripe: {
      backgroundColor: tintFor(args.severity),
      borderLeftWidth: 4,
      borderLeftColor: sevColor,
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginTop: 16,
      width: "100%",
    },
    stripeLabel: {
      fontFamily: resolved.fonts.bodyBold,
      fontSize: 14,
      color: sevColor,
      letterSpacing: 1,
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

  const report = StyleSheet.create({
    sectionLabel: {
      fontFamily: resolved.fonts.mono,
      fontSize: 9,
      color: resolved.colors.accent,
      textTransform: "uppercase",
      letterSpacing: 2,
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: resolved.fonts.heading,
      fontSize: 18,
      color: resolved.colors.ink,
      marginBottom: 16,
    },
    taxRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: resolved.colors.rule,
      paddingVertical: 8,
    },
    taxLabel: {
      fontSize: 11,
      color: resolved.colors.ink,
      fontFamily: resolved.fonts.body,
    },
    taxTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      fontSize: 9,
      fontFamily: resolved.fonts.mono,
      letterSpacing: 1,
    },
    summaryBlock: { marginTop: 12 },
    summaryHead: {
      fontFamily: resolved.fonts.mono,
      fontSize: 9,
      color: resolved.colors.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    summaryBody: {
      fontFamily: resolved.fonts.body,
      fontSize: 10.5,
      color: resolved.colors.ink,
      marginBottom: 10,
    },
    redlineBlock: {
      borderWidth: 1,
      borderColor: resolved.colors.rule,
      padding: 16,
      marginBottom: 14,
    },
    redlineHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    redlineLabel: {
      fontFamily: resolved.fonts.mono,
      fontSize: 9,
      color: resolved.colors.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    redlineExcerpt: {
      fontFamily: resolved.fonts.bodyItalic,
      fontSize: 10.5,
      color: resolved.colors.muted,
      marginBottom: 10,
    },
    redlineBody: {
      fontFamily: resolved.fonts.body,
      fontSize: 11,
      color: resolved.colors.ink,
      marginBottom: 10,
    },
  });

  const doc = (
    <Document title={`${args.title} — Review`}>
      {/* Cover */}
      <Page size="A4" style={cover.page}>
        {args.logoDataUrl ? (
          <Image
            src={args.logoDataUrl}
            style={{
              height: 40,
              maxWidth: 180,
              objectFit: "contain",
              marginBottom: 32,
            }}
          />
        ) : null}
        <Text style={cover.eyebrow}>// CONTRACT REVIEW</Text>
        <Text style={cover.title}>{args.title || "Untitled contract"}</Text>
        <View style={cover.accentRule} />
        <View style={cover.stripe}>
          <Text style={cover.stripeLabel}>{SEV_LABELS[args.severity]}</Text>
        </View>
        <Text style={cover.date}>
          Reviewed on {formatDate(args.reviewedAt)}
        </Text>
      </Page>

      {/* Summary + taxonomy */}
      <Page size="A4" style={pageStyle(resolved)}>
        <Text style={report.sectionLabel}>// VERDICT SUMMARY</Text>
        <View style={{ marginBottom: 24 }}>
          {verdictBlocks.length === 0 ? (
            <Text style={{ color: resolved.colors.muted, fontSize: 11 }}>
              No summary available.
            </Text>
          ) : (
            verdictBlocks.map((b, i) =>
              renderBlock(b, i, resolved, styles, verdictBlocks),
            )
          )}
        </View>

        <Text style={report.sectionLabel}>// CLAUSES SCANNED</Text>
        <View>
          {taxonomyRows.map(({ key, label, entry }, i) => {
            const sev: VerdictSeverity = entry?.severity ?? "green";
            const tagLabel = !entry
              ? "—"
              : entry.present
                ? SEV_SHORT[sev]
                : "ABSENT";
            const tagColor = !entry?.present
              ? resolved.colors.muted
              : SEV_COLORS[sev];
            const tagBg = !entry?.present ? "#EFEFEF" : tintFor(sev);
            const isLast = i === taxonomyRows.length - 1;
            return (
              <View
                key={key}
                style={[
                  report.taxRow,
                  isLast ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <Text style={report.taxLabel}>{label}</Text>
                <Text
                  style={[
                    report.taxTag,
                    { color: tagColor, backgroundColor: tagBg },
                  ]}
                >
                  {tagLabel}
                </Text>
              </View>
            );
          })}
        </View>

        {taxonomyRows.some(({ entry }) => entry?.summary) ? (
          <View style={report.summaryBlock}>
            <Text style={report.sectionLabel}>// CLAUSE NOTES</Text>
            {taxonomyRows
              .filter(({ entry }) => entry?.summary)
              .map(({ key, label, entry }) => (
                <View key={key} style={{ marginBottom: 10 }}>
                  <Text style={report.summaryHead}>// {label.toUpperCase()}</Text>
                  <Text style={report.summaryBody}>{entry!.summary}</Text>
                </View>
              ))}
          </View>
        ) : null}
      </Page>

      {/* Redlines */}
      <Page size="A4" style={pageStyle(resolved)}>
        <Text style={report.sectionLabel}>// SUGGESTED REDLINES</Text>
        {sortedRedlines.length === 0 ? (
          <Text style={{ color: resolved.colors.muted, fontSize: 11 }}>
            No redlines suggested.
          </Text>
        ) : (
          sortedRedlines.map((rl, idx) => {
            const sev = rl.severity;
            return (
              <View key={idx} style={report.redlineBlock} wrap={false}>
                <View style={report.redlineHead}>
                  <Text
                    style={{
                      fontFamily: resolved.fonts.mono,
                      fontSize: 9,
                      color: SEV_COLORS[sev],
                      backgroundColor: tintFor(sev),
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      letterSpacing: 1,
                    }}
                  >
                    {SEV_SHORT[sev]} · REDLINE {idx + 1}
                  </Text>
                </View>
                <Text style={report.redlineLabel}>// EXCERPT</Text>
                <Text style={report.redlineExcerpt}>
                  “{rl.clause_excerpt}”
                </Text>
                <Text style={report.redlineLabel}>// ISSUE</Text>
                <Text style={report.redlineBody}>{rl.issue}</Text>
                <Text style={report.redlineLabel}>// SUGGEST</Text>
                <Text style={report.redlineBody}>{rl.suggestion}</Text>
              </View>
            );
          })
        )}
      </Page>
    </Document>
  );

  const data = await renderToBuffer(doc);
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(data as unknown as Uint8Array);
}
