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
  if (isOnboarded()) {
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

  updateSettings({
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

export async function login(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const settings = getSettings();
  const { email, password } = parsed.data;

  if (
    !settings.adminEmail ||
    !settings.adminPasswordHash ||
    email.toLowerCase() !== settings.adminEmail.toLowerCase() ||
    !verifyPassword(password, settings.adminPasswordHash)
  ) {
    return { error: "Incorrect email or password." };
  }

  await createSession(settings.adminEmail);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
