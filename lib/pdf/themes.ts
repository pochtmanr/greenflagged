// Contract style tokens — typography / accent / layout / logo placement.
// Compose these 4 dimensions and resolve to a token bundle the PDF and
// DOCX renderers can consume. 81 combinations come "free" because we
// compose at render time instead of duplicating code per combo.

export type Typography = "editorial" | "modern" | "classic";
export type Accent = "sage" | "ink" | "brand";
export type Layout = "single" | "two-column" | "cover";
export type LogoPlacement = "header" | "footer" | "cover" | "none";

export type ContractStyle = {
  typography: Typography;
  accent: Accent;
  layout: Layout;
  logo_placement: LogoPlacement;
  brand_color?: string;
};

export const DEFAULT_STYLE: ContractStyle = {
  typography: "editorial",
  accent: "sage",
  layout: "single",
  logo_placement: "header",
};

export type ResolvedFonts = {
  heading: string;
  headingBold: string;
  body: string;
  bodyBold: string;
  bodyItalic: string;
  mono: string;
};

export type ResolvedStyle = {
  fonts: ResolvedFonts;
  colors: { ink: string; accent: string; muted: string; rule: string };
  layout: Layout;
  logo_placement: LogoPlacement;
};

// @react-pdf bundles Helvetica / Times-Roman / Courier without registration.
// Inter would require Font.register(). For now we keep it safe with built-ins;
// "editorial" maps to Helvetica + bold variant for headings to read close to Inter.
const FONTS: Record<Typography, ResolvedFonts> = {
  editorial: {
    heading: "Helvetica-Bold",
    headingBold: "Helvetica-Bold",
    body: "Helvetica",
    bodyBold: "Helvetica-Bold",
    bodyItalic: "Helvetica-Oblique",
    mono: "Courier",
  },
  modern: {
    heading: "Helvetica-Bold",
    headingBold: "Helvetica-Bold",
    body: "Helvetica",
    bodyBold: "Helvetica-Bold",
    bodyItalic: "Helvetica-Oblique",
    mono: "Courier",
  },
  classic: {
    heading: "Times-Bold",
    headingBold: "Times-Bold",
    body: "Times-Roman",
    bodyBold: "Times-Bold",
    bodyItalic: "Times-Italic",
    mono: "Courier",
  },
};

// DOCX uses simple font-family names (one string per family).
export const DOCX_FONTS: Record<Typography, { heading: string; body: string; mono: string }> = {
  editorial: { heading: "Inter", body: "Inter", mono: "JetBrains Mono" },
  modern: { heading: "Arial", body: "Arial", mono: "Consolas" },
  classic: { heading: "Times New Roman", body: "Times New Roman", mono: "Courier New" },
};

const ACCENTS: Record<"sage" | "ink", string> = {
  sage: "#4A7A5C",
  ink: "#0E110F",
};

export function resolveStyle(s: ContractStyle): ResolvedStyle {
  const accent =
    s.accent === "brand"
      ? normalizeHex(s.brand_color) ?? ACCENTS.sage
      : ACCENTS[s.accent];

  return {
    fonts: FONTS[s.typography],
    colors: {
      ink: "#0E110F",
      accent,
      muted: "#6B7280",
      rule: "#D9D5C7",
    },
    layout: s.layout,
    logo_placement: s.logo_placement,
  };
}

function normalizeHex(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^#?[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  }
  if (/^#?[0-9a-f]{3}$/i.test(trimmed)) {
    const t = trimmed.replace(/^#/, "");
    return `#${t[0]}${t[0]}${t[1]}${t[1]}${t[2]}${t[2]}`;
  }
  return null;
}

export function isContractStyle(x: unknown): x is ContractStyle {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    (o.typography === "editorial" || o.typography === "modern" || o.typography === "classic") &&
    (o.accent === "sage" || o.accent === "ink" || o.accent === "brand") &&
    (o.layout === "single" || o.layout === "two-column" || o.layout === "cover") &&
    (o.logo_placement === "header" ||
      o.logo_placement === "footer" ||
      o.logo_placement === "cover" ||
      o.logo_placement === "none")
  );
}

export function coerceStyle(x: unknown): ContractStyle {
  if (isContractStyle(x)) {
    const out: ContractStyle = {
      typography: x.typography,
      accent: x.accent,
      layout: x.layout,
      logo_placement: x.logo_placement,
    };
    if (x.accent === "brand" && typeof x.brand_color === "string") {
      out.brand_color = x.brand_color;
    }
    return out;
  }
  return { ...DEFAULT_STYLE };
}
