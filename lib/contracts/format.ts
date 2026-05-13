import { COUNTRIES } from "@/lib/countries";

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "*to be agreed*";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(amount: unknown, suffix = "€"): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "*to be agreed*";
  }
  const value = amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${suffix}${value}`;
}

export function formatCountry(code: unknown): string {
  if (typeof code !== "string" || !code) return "*to be agreed*";
  const c = COUNTRIES.find((country) => country.code === code);
  return c ? c.name : code;
}

export function fallback(value: unknown, hint: string): string {
  if (value === null || value === undefined) return `*${hint}*`;
  if (typeof value === "string" && value.trim() === "") return `*${hint}*`;
  if (typeof value === "number" && Number.isNaN(value)) return `*${hint}*`;
  return String(value);
}

export function paragraph(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function clauses(title: string, items: string[]): string {
  const numbered = items.map((line, i) => `${i + 1}. ${paragraph(line)}`).join("\n");
  return `## ${title}\n\n${numbered}`;
}

export function FOOTER(): string {
  return "---\n\n*This contract was drafted with AI assistance. Have a lawyer review for high-value engagements.*";
}
