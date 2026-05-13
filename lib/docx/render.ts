import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  Header,
  Footer,
  ExternalHyperlink,
  BorderStyle,
  PageBreak,
} from "docx";
import type { Block, Inline } from "@/lib/pdf/parse";
import { parseInline, parseMarkdown } from "@/lib/pdf/parse";
import { DOCX_FONTS, resolveStyle } from "@/lib/pdf/themes";
import type { ContractStyle, ResolvedStyle } from "@/lib/pdf/themes";
import type { BusinessFields } from "@/lib/pdf/render-themed";

export type ThemedDocxArgs = {
  body_md: string;
  title: string;
  style: ContractStyle;
  logo_buffer?: Buffer;
  business?: BusinessFields;
};

const COLOR_INK = "0E110F";
const COLOR_MUTED = "6B7280";

function stripHash(hex: string): string {
  return hex.startsWith("#") ? hex.slice(1) : hex;
}

function inlineRuns(
  inlines: Inline[],
  opts: { fontBody: string; accent: string },
): (TextRun | ExternalHyperlink)[] {
  const out: (TextRun | ExternalHyperlink)[] = [];
  for (const seg of inlines) {
    if (seg.kind === "link") {
      out.push(
        new ExternalHyperlink({
          link: seg.href,
          children: [
            new TextRun({
              text: seg.text,
              font: opts.fontBody,
              color: opts.accent,
              style: "Hyperlink",
            }),
          ],
        }),
      );
      continue;
    }
    out.push(
      new TextRun({
        text: seg.text,
        font: opts.fontBody,
        bold: seg.kind === "bold",
        italics: seg.kind === "italic",
      }),
    );
  }
  return out;
}

function detectImageType(buffer: Buffer): "png" | "jpg" | null {
  if (buffer.length >= 8) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return "png";
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      return "jpg";
    }
  }
  return null;
}

function logoParagraph(buffer: Buffer, height: number, align: (typeof AlignmentType)[keyof typeof AlignmentType]): Paragraph | null {
  const type = detectImageType(buffer);
  if (!type) return null; // skip SVG / unknown
  const ratio = 3; // assume reasonable aspect; ImageRun requires explicit dims
  return new Paragraph({
    alignment: align,
    children: [
      new ImageRun({
        type,
        data: new Uint8Array(buffer),
        transformation: { width: height * ratio, height },
      }),
    ],
  });
}

function blockToParagraphs(
  block: Block,
  fonts: { heading: string; body: string; mono: string },
  resolved: ResolvedStyle,
): Paragraph[] {
  const accent = stripHash(resolved.colors.accent);
  if (block.kind === "h1") {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({ text: block.text, bold: true, font: fonts.heading, color: COLOR_INK }),
        ],
      }),
    ];
  }
  if (block.kind === "h2") {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: block.text, bold: true, font: fonts.heading, color: accent }),
        ],
      }),
    ];
  }
  if (block.kind === "h3") {
    return [
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({ text: block.text, bold: true, font: fonts.heading, color: COLOR_INK }),
        ],
      }),
    ];
  }
  if (block.kind === "subtitle") {
    return [
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: block.text, italics: true, font: fonts.body, color: COLOR_MUTED }),
        ],
      }),
    ];
  }
  if (block.kind === "p") {
    return [
      new Paragraph({
        spacing: { after: 120 },
        children: inlineRuns(parseInline(block.text), { fontBody: fonts.body, accent }),
      }),
    ];
  }
  if (block.kind === "ol") {
    return block.items.map(
      (item, idx) =>
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${idx + 1}. `, font: fonts.body, bold: true, color: accent }),
            ...inlineRuns(parseInline(item), { fontBody: fonts.body, accent }),
          ],
        }),
    );
  }
  if (block.kind === "ul") {
    return block.items.map(
      (item) =>
        new Paragraph({
          spacing: { after: 60 },
          bullet: { level: 0 },
          children: inlineRuns(parseInline(item), { fontBody: fonts.body, accent }),
        }),
    );
  }
  if (block.kind === "hr") {
    return [
      new Paragraph({
        spacing: { before: 80, after: 80 },
        border: {
          bottom: { color: "D9D5C7", space: 1, style: BorderStyle.SINGLE, size: 6 },
        },
      }),
    ];
  }
  if (block.kind === "footer") {
    return [
      new Paragraph({
        spacing: { before: 240 },
        children: [
          new TextRun({ text: block.text, italics: true, font: fonts.body, color: COLOR_MUTED }),
        ],
      }),
    ];
  }
  return [];
}

function coverParagraphs(
  args: ThemedDocxArgs,
  fonts: { heading: string; body: string; mono: string },
  resolved: ResolvedStyle,
): Paragraph[] {
  const accent = stripHash(resolved.colors.accent);
  const out: Paragraph[] = [];
  if (args.logo_buffer && resolved.logo_placement !== "footer") {
    const para = logoParagraph(args.logo_buffer, 64, AlignmentType.CENTER);
    if (para) out.push(para);
  }
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 240 },
      children: [
        new TextRun({
          text: "// CONTRACT",
          font: fonts.mono,
          color: accent,
          size: 18,
        }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: args.title,
          font: fonts.heading,
          bold: true,
          size: 56,
        }),
      ],
    }),
  );

  const partyName =
    args.business?.business_name ||
    [args.business?.first_name, args.business?.family_name].filter(Boolean).join(" ") ||
    "";
  if (partyName) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({ text: partyName, font: fonts.body, size: 24 }),
        ],
      }),
    );
  }
  if (args.business?.address_line) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: args.business.address_line,
            font: fonts.body,
            color: COLOR_MUTED,
            size: 22,
          }),
        ],
      }),
    );
  }
  out.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480 },
      children: [
        new TextRun({
          text: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          font: fonts.mono,
          color: COLOR_MUTED,
          size: 20,
        }),
      ],
    }),
  );
  out.push(
    new Paragraph({
      children: [new PageBreak()],
    }),
  );
  return out;
}

export async function renderContractDocx(args: ThemedDocxArgs): Promise<Buffer> {
  const resolved = resolveStyle(args.style);
  const fonts = DOCX_FONTS[args.style.typography];

  const allBlocks = parseMarkdown(args.body_md);
  const titleBlock = allBlocks.find((b) => b.kind === "h1");
  const bodyBlocks = allBlocks.filter((b) => b !== titleBlock);

  const showCover =
    resolved.layout === "cover" || resolved.logo_placement === "cover";

  const children: Paragraph[] = [];
  if (showCover) {
    children.push(...coverParagraphs(args, fonts, resolved));
  } else {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 240 },
        children: [
          new TextRun({
            text: args.title,
            font: fonts.heading,
            bold: true,
            size: 44,
          }),
        ],
      }),
    );
  }

  for (const block of bodyBlocks) {
    children.push(...blockToParagraphs(block, fonts, resolved));
  }

  const headerPara =
    resolved.logo_placement === "header" && args.logo_buffer
      ? logoParagraph(args.logo_buffer, 32, AlignmentType.RIGHT)
      : null;
  const footerPara =
    resolved.logo_placement === "footer" && args.logo_buffer
      ? logoParagraph(args.logo_buffer, 24, AlignmentType.CENTER)
      : null;

  const headerLogo = headerPara ? new Header({ children: [headerPara] }) : undefined;
  const footerLogo = footerPara ? new Footer({ children: [footerPara] }) : undefined;

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: fonts.body, size: 22 } },
      },
    },
    sections: [
      {
        headers: headerLogo ? { default: headerLogo } : undefined,
        footers: footerLogo ? { default: footerLogo } : undefined,
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  return Buffer.from(buf);
}
