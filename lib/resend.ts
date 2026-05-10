import { Resend } from "resend";

let cached: Resend | null = null;

export function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  cached = new Resend(key);
  return cached;
}

export function getLeadTo(): string {
  const to = process.env.LEAD_TO_EMAIL;
  if (!to) throw new Error("LEAD_TO_EMAIL is not configured");
  return to;
}

export function getMailFrom(): string {
  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("MAIL_FROM is not configured");
  return from;
}
