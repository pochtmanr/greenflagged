import { NextResponse } from "next/server";
import { getLeadTo, getMailFrom, getResend } from "@/lib/resend";

export const runtime = "nodejs";

type Body = {
  name?: string;
  email?: string;
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const message = body.message?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Please share your name" },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: "Message should be at least 10 characters" },
      { status: 400 },
    );
  }

  const resend = getResend();
  const to = getLeadTo();
  const from = getMailFrom();

  const result = await resend.emails.send({
    from,
    to,
    subject: `[Green Flagged] Contact form — ${name}`,
    html: `
      <h2>New contact form submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
    `,
    replyTo: email,
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error.message ?? "Failed to send" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
