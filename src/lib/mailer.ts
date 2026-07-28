import nodemailer from "nodemailer";
import { getSettings, type Settings } from "@/lib/settings";

export class MailerNotConfiguredError extends Error {
  constructor() {
    super("Email isn't configured yet. Add your provider details in Settings to send invoices.");
    this.name = "MailerNotConfiguredError";
  }
}

export class MailProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailProviderError";
  }
}

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; url?: string }[];
};

export async function sendMail(options: SendMailOptions) {
  const settings = getSettings();

  if (settings.emailProvider === "mailanvil") {
    return sendViaMailAnvil(options, settings);
  }
  return sendViaSmtp(options, settings);
}

async function sendViaSmtp(options: SendMailOptions, settings: Settings) {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass || !settings.fromEmail) {
    throw new MailerNotConfiguredError();
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort ?? 587,
    secure: settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPass,
    },
  });

  await transporter.sendMail({
    from: `${settings.fromName || settings.businessName} <${settings.fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  });
}

// Verified directly against the live API (2026-07-28): `from` must be a bare
// email address — MailAnvil rejects the "Name <email>" display-name format
// with a generic "Invalid email" error — and the display name goes in a
// separate `from_name` field instead. `to` must be an array, not a string.
//
// Attachments use `path` (a public URL MailAnvil fetches server-side) rather
// than inline base64 `content` when a url is available: a real send showed
// the base64 path arriving as a blank PDF, with the attachment MIME part
// mislabeled `Content-Transfer-Encoding: 7bit` (invalid for binary data) on
// MailAnvil's side. The `path` field was confirmed to exist on the live API
// and sidesteps their base64-to-MIME conversion entirely.
async function sendViaMailAnvil(options: SendMailOptions, settings: Settings) {
  if (!settings.mailanvilApiKey || !settings.fromEmail) {
    throw new MailerNotConfiguredError();
  }

  const res = await fetch("https://api.mailanvil.com/v1/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.mailanvilApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: settings.fromEmail,
      from_name: settings.fromName || settings.businessName,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((a) =>
        a.url
          ? { filename: a.filename, path: a.url, content_type: "application/pdf" }
          : { filename: a.filename, content: a.content.toString("base64"), content_type: "application/pdf" },
      ),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message || `MailAnvil request failed (${res.status})`;
    throw new MailProviderError(message);
  }
}
