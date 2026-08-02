"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { tenants, settings } from "@/db/schema";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { isSignupDisabled, getPublicUrl } from "@/lib/env";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
} from "@/lib/platform-auth";
import {
  PlatformMailerNotConfiguredError,
  PlatformMailProviderError,
  sendPlatformMail,
} from "@/lib/platform-mailer";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type AuthActionResult = { error?: string; success?: boolean };

async function findTenantByEmail(email: string) {
  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.adminEmail, normalizeEmail(email)))
    .limit(1);
  return rows[0] ?? null;
}

const setupSchema = z.object({
  businessName: z.string().min(1),
  adminEmail: z.string().email(),
  password: z.string().min(8),
});

// Serializes concurrent first-setup requests with a transaction-scoped
// advisory lock so the isOnboarded check + tenant insert are atomic and only
// one tenant can ever be created.
const SETUP_LOCK_KEY = 727003;

export async function setupAccount(_prev: unknown, formData: FormData): Promise<AuthActionResult> {
  const parsed = setupSchema.safeParse({
    businessName: formData.get("businessName"),
    adminEmail: formData.get("adminEmail"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { businessName, adminEmail, password } = parsed.data;
  const email = normalizeEmail(adminEmail);

  const tenantId = `mt-${randomBytes(12).toString("hex")}`;
  const onboarded = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${SETUP_LOCK_KEY})`);
    const rows = await tx.select({ id: tenants.id }).from(tenants).limit(1);
    if (rows.length > 0) return true;
    await tx.insert(tenants).values({
      id: tenantId,
      authSecret: randomBytes(32).toString("hex"),
      adminEmail: email,
      adminPasswordHash: hashPassword(password),
      emailVerified: true,
      failedLoginAttempts: 0,
      loginLockedUntil: null,
    });
    await tx.insert(settings).values({ tenantId, businessName });
    return false;
  });

  if (onboarded) {
    redirect("/login");
  }

  await createSession(tenantId, email);
  redirect("/");
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Login needs its own brute-force throttle (no network-level rate limiting),
// tracked per tenant in the tenants table.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function login(_prev: unknown, formData: FormData): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;
  const tenant = await findTenantByEmail(email);

  // Fail with a generic message whether the email is unknown or the password
  // is wrong, so signup status can't be probed via login.
  if (!tenant || !tenant.adminPasswordHash) {
    return { error: "Incorrect email or password." };
  }

  if (tenant.loginLockedUntil && tenant.loginLockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((tenant.loginLockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  if (!verifyPassword(password, tenant.adminPasswordHash)) {
    const attempts = tenant.failedLoginAttempts + 1;
    await db
      .update(tenants)
      .set({
        failedLoginAttempts: attempts,
        loginLockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
      })
      .where(eq(tenants.id, tenant.id));
    return { error: "Incorrect email or password." };
  }

  if (!tenant.emailVerified) {
    return { error: "Please verify your email first. Check your inbox for a verification link." };
  }

  await db
    .update(tenants)
    .set({ failedLoginAttempts: 0, loginLockedUntil: null })
    .where(eq(tenants.id, tenant.id));
  await createSession(tenant.id, tenant.adminEmail);
  redirect("/");
}

const registerSchema = z.object({
  businessName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function register(_prev: unknown, formData: FormData): Promise<AuthActionResult> {
  if (isSignupDisabled()) {
    redirect("/login");
  }

  const parsed = registerSchema.safeParse({
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { businessName, email: rawEmail, password } = parsed.data;
  const email = normalizeEmail(rawEmail);

  const existing = await findTenantByEmail(email);
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const tenantId = `mt-${randomBytes(12).toString("hex")}`;
  await db.transaction(async (tx) => {
    await tx.insert(tenants).values({
      id: tenantId,
      authSecret: randomBytes(32).toString("hex"),
      adminEmail: email,
      adminPasswordHash: hashPassword(password),
      emailVerified: false,
      failedLoginAttempts: 0,
      loginLockedUntil: null,
    });

    await tx.insert(settings).values({ tenantId, businessName });
  });

  const token = await createEmailVerificationToken(tenantId, email);
  try {
    const publicUrl = getPublicUrl();
    if (!publicUrl) {
      await db.delete(tenants).where(eq(tenants.id, tenantId));
      return { error: "Couldn't send the verification email. Set the PUBLIC_URL environment variable." };
    }
    await sendPlatformMail({
      to: email,
      subject: "Verify your Docket account",
      html: verificationEmailHtml({ verifyUrl: `${publicUrl}/verify-email?token=${encodeURIComponent(token)}` }),
    });
  } catch (error) {
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    if (
      error instanceof PlatformMailerNotConfiguredError ||
      error instanceof PlatformMailProviderError
    ) {
      return { error: "Couldn't send the verification email. The platform email isn't configured." };
    }
    throw error;
  }

  // No session yet — the page just confirms the verification email was sent.
  return { success: true };
}

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export async function verifyEmail(_prev: unknown, formData: FormData): Promise<AuthActionResult> {
  const parsed = verifyEmailSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) {
    return { error: "This verification link is invalid." };
  }

  const payload = await verifyEmailVerificationToken(parsed.data.token);
  if (!payload) {
    return { error: "This verification link is invalid or has expired." };
  }

  await db
    .update(tenants)
    .set({ emailVerified: true })
    .where(eq(tenants.id, payload.tenantId));

  redirect("/login?verified=1");
}

export async function forgotPassword(_prev: unknown, formData: FormData): Promise<AuthActionResult> {
  const parsed = z.object({ email: z.string().email() }).safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const email = normalizeEmail(parsed.data.email);
  const tenant = await findTenantByEmail(email);

  // Always report success so the endpoint can't be used to enumerate emails.
  if (!tenant) {
    return { success: true };
  }

  const token = await createPasswordResetToken(tenant.id, tenant.adminEmail);
  try {
    const publicUrl = getPublicUrl();
    if (!publicUrl) {
      return { error: "Couldn't send the reset email. Set the PUBLIC_URL environment variable." };
    }
    await sendPlatformMail({
      to: tenant.adminEmail,
      subject: "Reset your Docket password",
      html: resetEmailHtml({ resetUrl: `${publicUrl}/reset-password?token=${encodeURIComponent(token)}` }),
    });
  } catch (error) {
    if (
      error instanceof PlatformMailerNotConfiguredError ||
      error instanceof PlatformMailProviderError
    ) {
      return { error: "Couldn't send the reset email. The platform email isn't configured." };
    }
    throw error;
  }

  return { success: true };
}

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function resetPassword(_prev: unknown, formData: FormData): Promise<AuthActionResult> {
  const token = formData.get("token");
  const parsed = resetPasswordSchema.safeParse({
    token,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Password must be at least 8 characters." };
  }

  const payload = await verifyPasswordResetToken(parsed.data.token);
  if (!payload) {
    return { error: "This reset link is invalid or has expired." };
  }

  await db
    .update(tenants)
    .set({
      adminPasswordHash: hashPassword(parsed.data.password),
      failedLoginAttempts: 0,
      loginLockedUntil: null,
    })
    .where(eq(tenants.id, payload.tenantId));

  redirect("/login?reset=1");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

function verificationEmailHtml({ verifyUrl }: { verifyUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Verify your Docket account</h2>
      <p>Click the button below to confirm your email address and finish setting up your account.</p>
      <p><a href="${verifyUrl}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Verify email</a></p>
      <p style="color:#666;font-size:13px">If the button doesn't work, paste this link into your browser:<br>${verifyUrl}</p>
      <p style="color:#666;font-size:13px">This link expires in 24 hours. If you didn't create a Docket account, you can ignore this email.</p>
    </div>
  `;
}

function resetEmailHtml({ resetUrl }: { resetUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2>Reset your Docket password</h2>
      <p>We got a request to reset your password. Click the button below to choose a new one.</p>
      <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">Reset password</a></p>
      <p style="color:#666;font-size:13px">If the button doesn't work, paste this link into your browser:<br>${resetUrl}</p>
      <p style="color:#666;font-size:13px">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
    </div>
  `;
}
