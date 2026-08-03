"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { superadmins } from "@/db/schema";
import {
  createSuperadminSession,
  destroySuperadminSession,
  requireSuperadmin,
} from "@/lib/superadmin-auth";
import { verifyPassword } from "@/lib/auth";

export type AdminActionResult = { error?: string };

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Same brute-force throttle as tenant login, tracked per superadmin row.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function adminLogin(_prev: unknown, formData: FormData): Promise<AdminActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;
  const admin = (
    await db
      .select()
      .from(superadmins)
      .where(eq(superadmins.email, normalizeEmail(email)))
      .limit(1)
  )[0];

  // Generic failure message — an unknown email and a wrong password are
  // indistinguishable, so operator accounts can't be probed.
  if (!admin) {
    return { error: "Incorrect email or password." };
  }

  if (admin.loginLockedUntil && admin.loginLockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((admin.loginLockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  if (!verifyPassword(password, admin.passwordHash)) {
    const attempts = admin.failedLoginAttempts + 1;
    await db
      .update(superadmins)
      .set({
        failedLoginAttempts: attempts,
        loginLockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS) : null,
      })
      .where(eq(superadmins.id, admin.id));
    return { error: "Incorrect email or password." };
  }

  await db
    .update(superadmins)
    .set({ failedLoginAttempts: 0, loginLockedUntil: null })
    .where(eq(superadmins.id, admin.id));

  await createSuperadminSession(admin.email);
  redirect("/admin");
}

export async function adminLogout() {
  await requireSuperadmin();
  await destroySuperadminSession();
  redirect("/admin/login");
}
