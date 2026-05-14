import { COUNTRIES } from "@/lib/countries";
import type { NameValue, AddressValue } from "./types";

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
  return "---\n\n*This document is a template, not legal advice. Have a qualified lawyer review country-specific requirements before signing. Drafted with AI assistance.*";
}

export function formatParty(name: unknown): string {
  if (!name || typeof name !== "object") return fallback(null, "the party");
  const n = name as NameValue;
  const first = typeof n.first === "string" ? n.first.trim() : "";
  const family = typeof n.family === "string" ? n.family.trim() : "";
  const business = typeof n.business === "string" ? n.business.trim() : "";
  const personal = [first, family].filter(Boolean).join(" ").trim();
  if (business) {
    return personal ? `${business} (represented by ${personal})` : business;
  }
  return personal || fallback(null, "the party");
}

export function formatAddress(addr: unknown): string {
  if (!addr || typeof addr !== "object") return fallback(null, "address to be added");
  const a = addr as AddressValue;
  const street = typeof a.street === "string" ? a.street.trim() : "";
  const postal = typeof a.postal === "string" ? a.postal.trim() : "";
  const city = typeof a.city === "string" ? a.city.trim() : "";
  const cityLine = [postal, city].filter(Boolean).join(" ").trim();
  const country = a.country ? formatCountry(a.country) : "";
  const parts = [street, cityLine, country].filter(
    (s) => s && s !== "*to be agreed*",
  );
  return parts.length ? parts.join(", ") : fallback(null, "address to be added");
}
