import { NextResponse } from "next/server";
import { getLeadTo, getMailFrom, getResend } from "@/lib/resend";

export const runtime = "nodejs";

type Body = {
  email?: string;
  source?: string;
  fileName?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const source = body.source?.trim() ?? "unknown";
  const fileName = body.fileName?.trim();

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "A valid email is required" },
      { status: 400 },
    );
  }

  const resend = getResend();
  const to = getLeadTo();
  const from = getMailFrom();

  const subject = `[Green Flagged] New lead — ${source}`;
  const html = `
    <h2>New Green Flagged lead</h2>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Source:</strong> ${source}</p>
    ${fileName ? `<p><strong>File:</strong> ${fileName}</p>` : ""}
    <p><em>Captured at ${new Date().toISOString()}</em></p>
  `;

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
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
