import nodemailer from "nodemailer";
import { getPlatformEmailConfig } from "@/lib/env";

// Platform-level mail used for auth emails (verification, password reset).
// Unlike invoice sending, this is configured via the environment rather than
// per-tenant settings because it must work before a tenant exists / before
// they've entered their own SMTP details.

export class PlatformMailerNotConfiguredError extends Error {
  constructor() {
    super(
      "Email isn't configured for this Docket instance. Set MAILANVIL_KEY or SMTP_* plus PLATFORM_EMAIL in the environment.",
    );
    this.name = "PlatformMailerNotConfiguredError";
  }
}

export class PlatformMailProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformMailProviderError";
  }
}

type SendPlatformMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendPlatformMail(options: SendPlatformMailOptions) {
  const config = getPlatformEmailConfig();
  if (!config) throw new PlatformMailerNotConfiguredError();

  if (config.provider === "smtp") {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost!,
      port: config.smtpPort!,
      secure: config.smtpSecure,
      auth: {
        user: config.smtpUser!,
        pass: config.smtpPass!,
      },
    });
    await transporter.sendMail({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return;
  }

  const res = await fetch("https://api.mailanvil.com/v1/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.mailanvilKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.fromEmail,
      from_name: config.fromName,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message || `MailAnvil request failed (${res.status})`;
    throw new PlatformMailProviderError(message);
  }
}
