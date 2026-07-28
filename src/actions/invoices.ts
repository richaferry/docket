"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { invoices, invoiceItems, activities, clients } from "@/db/schema";
import { calcTotals, reserveInvoiceNumber, buildInvoicePdfData } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf/invoice-document";
import { sendMail, MailerNotConfiguredError, MailProviderError } from "@/lib/mailer";
import { getSettings } from "@/lib/settings";
import { getPublicUrl } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/utils";

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
});

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Choose a client"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  paymentTerms: z.string().min(1).default("custom"),
  currency: z.string().min(1),
  taxLabel: z.string().min(1),
  taxRate: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.string().transform((val, ctx) => {
    try {
      const parsed = JSON.parse(val);
      const result = z.array(itemSchema).min(1, "Add at least one line item").parse(parsed);
      return result;
    } catch {
      ctx.addIssue({ code: "custom", message: "Add at least one valid line item" });
      return z.NEVER;
    }
  }),
});

function parseInvoiceForm(formData: FormData) {
  return invoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    issueDate: formData.get("issueDate"),
    dueDate: formData.get("dueDate"),
    paymentTerms: formData.get("paymentTerms") || undefined,
    currency: formData.get("currency"),
    taxLabel: formData.get("taxLabel"),
    taxRate: formData.get("taxRate"),
    discount: formData.get("discount"),
    notes: formData.get("notes") || undefined,
    terms: formData.get("terms") || undefined,
    items: formData.get("items"),
  });
}

export async function createInvoice(_prev: unknown, formData: FormData) {
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { items, ...values } = parsed.data;
  const { subtotal, total } = calcTotals(items, values.taxRate, values.discount);
  const number = reserveInvoiceNumber();
  const id = nanoid();

  db.transaction((tx) => {
    tx.insert(invoices)
      .values({
        id,
        publicId: nanoid(16),
        number,
        clientId: values.clientId,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        paymentTerms: values.paymentTerms,
        currency: values.currency,
        taxLabel: values.taxLabel,
        taxRate: values.taxRate,
        discount: values.discount,
        subtotal,
        total,
        notes: values.notes,
        terms: values.terms,
      })
      .run();

    items.forEach((item, index) => {
      tx.insert(invoiceItems)
        .values({
          id: nanoid(),
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: index,
        })
        .run();
    });
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function updateInvoice(id: string, _prev: unknown, formData: FormData) {
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (!existing) return { error: "Invoice not found" };

  const { items, ...values } = parsed.data;
  const { subtotal, total } = calcTotals(items, values.taxRate, values.discount);

  db.transaction((tx) => {
    tx.update(invoices)
      .set({
        clientId: values.clientId,
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        paymentTerms: values.paymentTerms,
        currency: values.currency,
        taxLabel: values.taxLabel,
        taxRate: values.taxRate,
        discount: values.discount,
        subtotal,
        total,
        notes: values.notes,
        terms: values.terms,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .run();

    tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id)).run();
    items.forEach((item, index) => {
      tx.insert(invoiceItems)
        .values({
          id: nanoid(),
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sortOrder: index,
        })
        .run();
    });
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  db.delete(invoices).where(eq(invoices.id, id)).run();
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function sendInvoice(id: string) {
  const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (!invoice) return { error: "Invoice not found" };

  const client = db.select().from(clients).where(eq(clients.id, invoice.clientId)).get();
  if (!client) return { error: "Client not found" };

  const settings = getSettings();
  const publicUrl = getPublicUrl();
  if (!publicUrl) {
    return {
      error: "Set the PUBLIC_URL environment variable (and restart the server) before sending invoices — it's used to build the client-facing link.",
    };
  }
  const link = `${publicUrl}/i/${invoice.publicId}`;

  const data = buildInvoicePdfData(id);

  try {
    const pdfBuffer = await renderInvoicePdf(data);

    await sendMail({
      to: client.email,
      subject: `Invoice ${invoice.number} from ${settings.businessName}`,
      html: `
        <p>Hi ${client.name},</p>
        <p>Please find attached invoice <strong>${invoice.number}</strong> for
        <strong>${formatMoney(invoice.total, invoice.currency)}</strong>, due ${formatDate(invoice.dueDate)}.</p>
        <p>You can also view it online: <a href="${link}">${link}</a></p>
        <p>Thanks,<br/>${settings.businessName}</p>
      `,
      attachments: [
        { filename: `${invoice.number}.pdf`, content: pdfBuffer, url: `${link}/pdf` },
      ],
    });
  } catch (err) {
    if (err instanceof MailerNotConfiguredError || err instanceof MailProviderError) {
      return { error: err.message };
    }
    return { error: "Couldn't send the email. Check your email provider settings." };
  }

  db.update(invoices)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .run();

  db.insert(activities)
    .values({
      id: nanoid(),
      clientId: invoice.clientId,
      type: "invoice_sent",
      content: `Invoice ${invoice.number} (${formatMoney(invoice.total, invoice.currency)}) sent.`,
    })
    .run();

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { error: null, success: true };
}

export async function markInvoicePaid(id: string) {
  const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (!invoice) return;

  db.update(invoices)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .run();

  db.insert(activities)
    .values({
      id: nanoid(),
      clientId: invoice.clientId,
      type: "invoice_paid",
      content: `Invoice ${invoice.number} (${formatMoney(invoice.total, invoice.currency)}) marked paid.`,
    })
    .run();

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function cancelInvoice(id: string) {
  db.update(invoices)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .run();
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

export async function reopenInvoice(id: string) {
  db.update(invoices)
    .set({ status: "draft", sentAt: null, paidAt: null, updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .run();
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}
