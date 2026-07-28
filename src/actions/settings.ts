"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getSettings, updateSettings } from "@/lib/settings";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { sendMail, MailerNotConfiguredError, MailProviderError } from "@/lib/mailer";

const businessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessEmail: z.string().email("Enter a valid email"),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  publicUrl: z
    .string()
    .url("Enter a full URL, including https://")
    .optional()
    .or(z.literal("")),
});

export async function updateBusinessProfile(_prev: unknown, formData: FormData) {
  const parsed = businessSchema.safeParse({
    businessName: formData.get("businessName"),
    businessEmail: formData.get("businessEmail"),
    businessAddress: formData.get("businessAddress") || undefined,
    businessPhone: formData.get("businessPhone") || undefined,
    publicUrl: formData.get("publicUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  updateSettings(parsed.data);
  revalidatePath("/settings");
  return { error: null, success: true };
}

const invoiceDefaultsSchema = z.object({
  currency: z.string().min(1),
  taxLabel: z.string().min(1),
  defaultTaxRate: z.coerce.number().min(0),
  invoicePrefix: z.string().min(1),
  nextInvoiceNumber: z.coerce.number().int().min(1),
  defaultTerms: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

export async function updateInvoiceDefaults(_prev: unknown, formData: FormData) {
  const parsed = invoiceDefaultsSchema.safeParse({
    currency: formData.get("currency"),
    taxLabel: formData.get("taxLabel"),
    defaultTaxRate: formData.get("defaultTaxRate"),
    invoicePrefix: formData.get("invoicePrefix"),
    nextInvoiceNumber: formData.get("nextInvoiceNumber"),
    defaultTerms: formData.get("defaultTerms") || undefined,
    paymentInstructions: formData.get("paymentInstructions") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  updateSettings(parsed.data);
  revalidatePath("/settings");
  return { error: null, success: true };
}

const smtpSchema = z.object({
  emailProvider: z.literal("smtp"),
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.coerce.number().int().min(1),
  smtpSecure: z.coerce.boolean(),
  smtpUser: z.string().min(1, "SMTP username is required"),
  smtpPass: z.string().min(1, "SMTP password is required"),
  fromName: z.string().optional(),
  fromEmail: z.string().email("Enter a valid sender email"),
});

const mailanvilSchema = z.object({
  emailProvider: z.literal("mailanvil"),
  mailanvilApiKey: z.string().min(1, "API key is required"),
  fromName: z.string().optional(),
  fromEmail: z.string().email("Enter a valid sender email"),
});

const emailSettingsSchema = z.discriminatedUnion("emailProvider", [smtpSchema, mailanvilSchema]);

export async function updateEmailSettings(_prev: unknown, formData: FormData) {
  const emailProvider = formData.get("emailProvider") === "mailanvil" ? "mailanvil" : "smtp";

  const parsed = emailSettingsSchema.safeParse({
    emailProvider,
    smtpHost: formData.get("smtpHost"),
    smtpPort: formData.get("smtpPort"),
    smtpSecure: formData.get("smtpSecure") === "on",
    smtpUser: formData.get("smtpUser"),
    smtpPass: formData.get("smtpPass"),
    mailanvilApiKey: formData.get("mailanvilApiKey"),
    fromName: formData.get("fromName") || undefined,
    fromEmail: formData.get("fromEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  updateSettings(parsed.data);
  revalidatePath("/settings");
  return { error: null, success: true };
}

export async function sendTestEmail(_prev: unknown, formData: FormData) {
  const to = formData.get("testEmailTo") as string;
  if (!to) return { error: "Enter an email address to send the test to." };

  const settings = getSettings();
  try {
    await sendMail({
      to,
      subject: `Test email from ${settings.businessName || "Docket"}`,
      html: `<p>This is a test email from your Docket workspace. If you got this, sending is working.</p>`,
    });
  } catch (err) {
    if (err instanceof MailerNotConfiguredError || err instanceof MailProviderError) {
      return { error: err.message };
    }
    return { error: "Couldn't send — double check your email provider credentials." };
  }

  return { error: null, success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  });

export async function changePassword(_prev: unknown, formData: FormData) {
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const settings = getSettings();
  if (!settings.adminPasswordHash || !verifyPassword(parsed.data.currentPassword, settings.adminPasswordHash)) {
    return { error: "Current password is incorrect." };
  }

  updateSettings({ adminPasswordHash: hashPassword(parsed.data.newPassword) });
  return { error: null, success: true };
}
