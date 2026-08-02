"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { getSettings, isOnboarded, updateSettings } from "@/lib/settings";

const setupSchema = z.object({
  businessName: z.string().min(1),
  adminEmail: z.string().email(),
  password: z.string().min(8),
});

export async function setupAccount(_prev: unknown, formData: FormData) {
  if (await isOnboarded()) {
    redirect("/login");
  }

  const parsed = setupSchema.safeParse({
    businessName: formData.get("businessName"),
    adminEmail: formData.get("adminEmail"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { businessName, adminEmail, password } = parsed.data;

  await updateSettings({
    businessName,
    businessEmail: adminEmail,
    adminEmail,
    adminPasswordHash: hashPassword(password),
  });

  await createSession(adminEmail);
  redirect("/");
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// The app has exactly one account and no rate limiting at the network
// layer, so — especially once exposed publicly via PUBLIC_URL/a tunnel —
// login needs its own brute-force throttle rather than relying on anything
// external.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function login(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const settings = await getSettings();

  if (settings.loginLockedUntil && settings.loginLockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((settings.loginLockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  const { email, password } = parsed.data;

  const valid =
    !!settings.adminEmail &&
    !!settings.adminPasswordHash &&
    email.toLowerCase() === settings.adminEmail.toLowerCase() &&
    verifyPassword(password, settings.adminPasswordHash);

  if (!valid) {
    const attempts = settings.failedLoginAttempts + 1;
    await updateSettings({
      failedLoginAttempts: attempts,
      loginLockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
    });
    return { error: "Incorrect email or password." };
  }

  await updateSettings({ failedLoginAttempts: 0, loginLockedUntil: null });
  await createSession(settings.adminEmail!);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
