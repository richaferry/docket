import { randomBytes } from "node:crypto";

// Where the app is reachable from the internet — used to build the
// client-facing invoice link in emails. Configured via .env rather than the
// Settings UI since it's server/deployment config, not workspace data.
export function getPublicUrl(): string | null {
  const raw = process.env.PUBLIC_URL;
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

// Postgres connection string (Neon pooled URL in production, a local or
// container Postgres in dev). Defaults to a local Postgres so the module can
// load without configuration; actual queries still require a reachable DB.
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";
}

// Platform-level signing key for short-lived auth tokens (email verification,
// password reset). Must be stable across restarts in production; a random
// per-process fallback keeps local dev working if AUTH_SECRET isn't set.
let fallbackAuthSecret: string | null = null;

export function getAuthSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  fallbackAuthSecret ??= randomBytes(32).toString("hex");
  return fallbackAuthSecret;
}

// Platform-wide email delivery for auth emails (verification, password
// reset). Configured via the environment, not per-tenant settings — these
// must work before a tenant has filled in their own SMTP details.
export type PlatformEmailConfig = {
  provider: "smtp" | "mailanvil";
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  mailanvilKey?: string;
  fromName: string;
  fromEmail: string;
};

export function getPlatformEmailConfig(): PlatformEmailConfig | null {
  const fromName = process.env.PLATFORM_EMAIL_NAME ?? "Docket";
  const mailanvilKey = process.env.MAILANVIL_KEY;
  if (mailanvilKey && process.env.PLATFORM_EMAIL) {
    return {
      provider: "mailanvil",
      mailanvilKey,
      fromName,
      fromEmail: process.env.PLATFORM_EMAIL,
    };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass && process.env.PLATFORM_EMAIL) {
    return {
      provider: "smtp",
      smtpHost,
      smtpPort: Number(process.env.SMTP_PORT ?? 587),
      smtpSecure: process.env.SMTP_SECURE === "true",
      smtpUser,
      smtpPass,
      fromName,
      fromEmail: process.env.PLATFORM_EMAIL,
    };
  }

  return null;
}

// Master switch to close the platform to new signups.
export function isSignupDisabled(): boolean {
  return ["1", "true", "yes", "on"].includes((process.env.DISABLE_SIGNUP ?? "").toLowerCase());
}
