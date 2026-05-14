// Contract style tokens — typography / accent / layout / logo placement.
// Compose these 4 dimensions and resolve to a token bundle the PDF and
// DOCX renderers can consume.

export type Typography = "editorial" | "modern" | "classic";
export type Accent = "ink" | "brand";
export type Layout = "single" | "two-column" | "cover";
export type LogoPlacement = "header" | "header_with_info" | "cover" | "none";

export type ContractStyle = {
  typography: Typography;
  accent: Accent;
  layout: Layout;
  logo_placement: LogoPlacement;
  brand_color?: string;
};

export const DEFAULT_STYLE: ContractStyle = {
  typography: "editorial",
  accent: "ink",
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

// Browser-side font stacks shared by the on-screen `.doc-preview` and the
// live editor surface. The PDF renderer above can only use bundled families,
// so it has its own `FONTS` map.
export const DOC_PREVIEW_FONTS: Record<
  Typography,
  { heading: string; body: string }
> = {
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

const INK_HEX = "#0E110F";

export function resolveStyle(s: ContractStyle): ResolvedStyle {
  const accent =
    s.accent === "brand" ? (normalizeHex(s.brand_color) ?? INK_HEX) : INK_HEX;

  return {
    fonts: FONTS[s.typography],
    colors: {
      ink: INK_HEX,
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

function isTypography(x: unknown): x is Typography {
  return x === "editorial" || x === "modern" || x === "classic";
}

function isLayout(x: unknown): x is Layout {
  return x === "single" || x === "two-column" || x === "cover";
}

export function isContractStyle(x: unknown): x is ContractStyle {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    isTypography(o.typography) &&
    (o.accent === "ink" || o.accent === "brand") &&
    isLayout(o.layout) &&
    (o.logo_placement === "header" ||
      o.logo_placement === "header_with_info" ||
      o.logo_placement === "cover" ||
      o.logo_placement === "none")
  );
}

// Coerces older persisted styles into the new shape. Sage → ink, footer → none.
export function coerceStyle(x: unknown): ContractStyle {
  if (!x || typeof x !== "object") return { ...DEFAULT_STYLE };
  const o = x as Record<string, unknown>;

  const typography: Typography = isTypography(o.typography)
    ? o.typography
    : DEFAULT_STYLE.typography;

  let accent: Accent;
  if (o.accent === "brand") accent = "brand";
  else if (o.accent === "ink") accent = "ink";
  else accent = "ink"; // sage / unknown collapse to ink

  const layout: Layout = isLayout(o.layout) ? o.layout : DEFAULT_STYLE.layout;

  let logo_placement: LogoPlacement;
  if (
    o.logo_placement === "header" ||
    o.logo_placement === "header_with_info" ||
    o.logo_placement === "cover" ||
    o.logo_placement === "none"
  ) {
    logo_placement = o.logo_placement;
  } else if (o.logo_placement === "footer") {
    logo_placement = "none"; // footer retired
  } else {
    logo_placement = DEFAULT_STYLE.logo_placement;
  }

  const out: ContractStyle = { typography, accent, layout, logo_placement };
  if (accent === "brand" && typeof o.brand_color === "string") {
    const norm = normalizeHex(o.brand_color);
    if (norm) out.brand_color = norm;
  }
  return out;
}
