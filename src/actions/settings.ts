"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { updateSettings } from "@/lib/settings";
import { hashPassword, verifyPassword, requireSession } from "@/lib/auth";
import { CURRENCY_CODES } from "@/lib/currencies";

const businessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessEmail: z.string().email("Enter a valid email"),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
});

export async function updateBusinessProfile(_prev: unknown, formData: FormData) {
  const { tenantId } = await requireSession();
  const parsed = businessSchema.safeParse({
    businessName: formData.get("businessName"),
    businessEmail: formData.get("businessEmail"),
    businessAddress: formData.get("businessAddress") || undefined,
    businessPhone: formData.get("businessPhone") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateSettings(tenantId, parsed.data);
  revalidatePath("/settings");
  return { error: null, success: true };
}

const invoiceDefaultsSchema = z.object({
  currency: z.enum(CURRENCY_CODES, { message: "Choose a valid currency" }),
  defaultPaymentTerms: z.string().min(1),
  taxLabel: z.string().min(1),
  defaultTaxRate: z.coerce.number().min(0),
  invoicePrefix: z.string().min(1),
  nextInvoiceNumber: z.coerce.number().int().min(1),
  defaultTerms: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

export async function updateInvoiceDefaults(_prev: unknown, formData: FormData) {
  const { tenantId } = await requireSession();
  const parsed = invoiceDefaultsSchema.safeParse({
    currency: formData.get("currency"),
    defaultPaymentTerms: formData.get("defaultPaymentTerms"),
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

  await updateSettings(tenantId, parsed.data);
  revalidatePath("/settings");
  return { error: null, success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  });

export async function changePassword(_prev: unknown, formData: FormData) {
  const { tenantId } = await requireSession();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const tenant = (
    await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  )[0];
  if (!tenant?.adminPasswordHash || !verifyPassword(parsed.data.currentPassword, tenant.adminPasswordHash)) {
    return { error: "Current password is incorrect." };
  }

  await db
    .update(tenants)
    .set({ adminPasswordHash: hashPassword(parsed.data.newPassword) })
    .where(eq(tenants.id, tenantId));
  return { error: null, success: true };
}
