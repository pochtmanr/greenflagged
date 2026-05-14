// Template-only translation. The translator must rewrite template phrases
// (clause headings, structural sentences, boilerplate) into the target locale
// while leaving every user-supplied content block verbatim (party names,
// addresses, scope of work text, amounts, dates, governing-law country name).
//
// We use Anthropic's small/cheap model via lib/ai/complete.ts.

import { complete } from "@/lib/ai/complete";

export const SUPPORTED_LOCALES = ["en", "de", "es", "fr", "he"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  he: "Hebrew",
};

export const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((code) => ({
  value: code,
  label: LOCALE_LABEL[code],
}));

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

const SYSTEM_PROMPT = `You translate legal contract templates between languages.

CRITICAL RULES — read carefully:
1. Translate ONLY structural / template phrasing: clause headings, numbered
   clause text that uses generic legal language, boilerplate sentences.
2. NEVER translate or alter content that looks like user input:
   - Personal names (e.g. "John Smith", "Acme GmbH")
   - Street addresses, postal codes, cities, country names
   - Monetary amounts and currency symbols
   - Dates (keep the original numeric or month spelling, do not localise)
   - Scope-of-work prose written by the user
   - URLs, emails, phone numbers
3. Preserve the markdown structure EXACTLY: headings ('# ', '## ', '### '),
   horizontal rules ('---'), numbered lists ('1. ', '2. '), bold ('**...**'),
   italic ('*...*'), links ('[text](url)'). Same number of blocks, same order.
4. Do not add any commentary, explanation, or wrapper text. Output only the
   translated markdown.
5. The footer disclaimer about AI assistance MUST be translated.

If a line is ambiguous (could be either template or user content), prefer NOT
translating it.`;

export async function translateTemplate(
  body_md: string,
  locale: Locale,
): Promise<string> {
  if (locale === "en") return body_md;

  const userPrompt = `Translate the following contract template markdown into ${LOCALE_LABEL[locale]} according to the rules.

Source markdown:

${body_md}`;

  const out = await complete({
    model: "gpt-4o-mini",
    system: SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 8000,
  });

  return out.trim();
}
