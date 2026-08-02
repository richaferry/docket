"use server";

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { invoices, invoiceItems, activities, clients, payments } from "@/db/schema";
import { calcTotals, reserveInvoiceNumber, buildInvoicePdfData, remainingBalance } from "@/lib/invoices";
import { renderInvoicePdf } from "@/lib/pdf/invoice-document";
import { sendMail, MailerNotConfiguredError, MailProviderError } from "@/lib/mailer";
import { getSettings } from "@/lib/settings";
import { getPublicUrl } from "@/lib/env";
import { requireSession } from "@/lib/auth";
import { CURRENCY_CODES } from "@/lib/currencies";
import { formatMoney, formatDate, escapeHtml } from "@/lib/utils";

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
  currency: z.enum(CURRENCY_CODES, { message: "Choose a valid currency" }),
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
  await requireSession();
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { items, ...values } = parsed.data;
  const { subtotal, total } = calcTotals(items, values.taxRate, values.discount);
  const number = await reserveInvoiceNumber();
  const id = nanoid();

  await db.transaction(async (tx) => {
    await tx.insert(invoices).values({
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
    });

    for (const [index, item] of items.entries()) {
      await tx.insert(invoiceItems).values({
        id: nanoid(),
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sortOrder: index,
      });
    }
  });

  revalidatePath("/invoices");
  redirect(`/invoices/${id}`);
}

export async function updateInvoice(id: string, _prev: unknown, formData: FormData) {
  await requireSession();
  const parsed = parseInvoiceForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = (await db.select().from(invoices).where(eq(invoices.id, id)).limit(1))[0];
  if (!existing) return { error: "Invoice not found" };

  const { items, ...values } = parsed.data;
  const { subtotal, total } = calcTotals(items, values.taxRate, values.discount);

  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
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
      .where(eq(invoices.id, id));

    await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    for (const [index, item] of items.entries()) {
      await tx.insert(invoiceItems).values({
        id: nanoid(),
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        sortOrder: index,
      });
    }
  });

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function deleteInvoice(id: string) {
  await requireSession();
  await db.delete(invoices).where(eq(invoices.id, id));
  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function sendInvoice(id: string) {
  await requireSession();
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, id)).limit(1))[0];
  if (!invoice) return { error: "Invoice not found" };

  const client = (await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1))[0];
  if (!client) return { error: "Client not found" };

  const settings = await getSettings();
  const publicUrl = getPublicUrl();
  if (!publicUrl) {
    return {
      error: "Set the PUBLIC_URL environment variable (and restart the server) before sending invoices — it's used to build the client-facing link.",
    };
  }
  const link = `${publicUrl}/i/${invoice.publicId}`;

  const data = await buildInvoicePdfData(id);
  const remaining = remainingBalance(invoice);
  const amountLabel =
    invoice.amountPaid > 0
      ? `<strong>${formatMoney(remaining, invoice.currency)}</strong> remaining (of ${formatMoney(invoice.total, invoice.currency)})`
      : `<strong>${formatMoney(invoice.total, invoice.currency)}</strong>`;

  try {
    const pdfBuffer = await renderInvoicePdf(data);

    await sendMail({
      to: client.email,
      subject: `Invoice ${invoice.number} from ${settings.businessName}`,
      html: `
        <p>Hi ${escapeHtml(client.name)},</p>
        <p>Please find attached invoice <strong>${escapeHtml(invoice.number)}</strong> for
        ${amountLabel}, due ${formatDate(invoice.dueDate)}.</p>
        <p>You can also view it online: <a href="${link}">${link}</a></p>
        <p>Thanks,<br/>${escapeHtml(settings.businessName)}</p>
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

  await db
    .update(invoices)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id));

  await db.insert(activities).values({
    id: nanoid(),
    clientId: invoice.clientId,
    type: "invoice_sent",
    content: `Invoice ${invoice.number} (${formatMoney(invoice.total, invoice.currency)}) sent.`,
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { error: null, success: true };
}

export async function markInvoicePaid(id: string) {
  await requireSession();
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, id)).limit(1))[0];
  if (!invoice) return;

  await db
    .update(invoices)
    .set({ status: "paid", amountPaid: invoice.total, paidAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id));

  await db.insert(activities).values({
    id: nanoid(),
    clientId: invoice.clientId,
    type: "invoice_paid",
    content: `Invoice ${invoice.number} (${formatMoney(invoice.total, invoice.currency)}) marked paid.`,
  });

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/clients");
}

export async function cancelInvoice(id: string, _prev: unknown, _formData: FormData) {
  await requireSession();
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, id)).limit(1))[0];
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.amountPaid > 0) {
    return {
      error:
        "This invoice has payments recorded against it and can't be cancelled. Delete the payments first if you need to cancel it.",
    };
  }

  await db
    .update(invoices)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(invoices.id, id));
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  return { error: null, success: true };
}

export async function reopenInvoice(id: string) {
  await requireSession();
  await db
    .update(invoices)
    .set({ status: "draft", sentAt: null, paidAt: null, updatedAt: new Date() })
    .where(eq(invoices.id, id));
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
}

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  paidAt: z.coerce.date(),
  note: z.string().optional(),
});

export async function recordPayment(invoiceId: string, _prev: unknown, formData: FormData) {
  await requireSession();
  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    paidAt: formData.get("paidAt"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const invoice = (await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0];
  if (!invoice) return { error: "Invoice not found" };
  if (invoice.status === "draft") {
    return { error: "Send the invoice before recording a payment against it." };
  }
  if (invoice.status === "cancelled") {
    return { error: "This invoice is cancelled." };
  }
  if (invoice.status === "paid") {
    return { error: "This invoice is already fully paid." };
  }

  const remaining = remainingBalance(invoice);
  if (parsed.data.amount > remaining + 0.005) {
    return {
      error: `That exceeds the remaining balance of ${formatMoney(remaining, invoice.currency)}.`,
    };
  }

  const newAmountPaid = invoice.amountPaid + parsed.data.amount;
  const nowFullyPaid = newAmountPaid >= invoice.total - 0.005;
  const newRemaining = remainingBalance({ total: invoice.total, amountPaid: newAmountPaid });

  await db.transaction(async (tx) => {
    await tx.insert(payments).values({
      id: nanoid(),
      invoiceId,
      amount: parsed.data.amount,
      paidAt: parsed.data.paidAt,
      note: parsed.data.note,
    });

    await tx
      .update(invoices)
      .set({
        amountPaid: newAmountPaid,
        status: nowFullyPaid ? "paid" : invoice.status,
        paidAt: nowFullyPaid ? parsed.data.paidAt : invoice.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    await tx.insert(activities).values({
      id: nanoid(),
      clientId: invoice.clientId,
      type: nowFullyPaid ? "invoice_paid" : "payment_received",
      content: nowFullyPaid
        ? `Invoice ${invoice.number} (${formatMoney(invoice.total, invoice.currency)}) paid in full.`
        : `Payment of ${formatMoney(parsed.data.amount, invoice.currency)} received for ${invoice.number} (${formatMoney(newRemaining, invoice.currency)} remaining).`,
    });
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/clients");
  return { error: null, success: true };
}

export async function deletePayment(invoiceId: string, paymentId: string) {
  await requireSession();
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0];
  if (!invoice) return;
  const payment = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
  if (!payment) return;

  const newAmountPaid = Math.max(invoice.amountPaid - payment.amount, 0);
  const stillFullyPaid = newAmountPaid >= invoice.total - 0.005;
  const wasAutoPaid = invoice.status === "paid" && !stillFullyPaid;

  await db.transaction(async (tx) => {
    await tx.delete(payments).where(eq(payments.id, paymentId));
    await tx
      .update(invoices)
      .set({
        amountPaid: newAmountPaid,
        status: wasAutoPaid ? "sent" : invoice.status,
        paidAt: wasAutoPaid ? null : invoice.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  });

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/clients");
}
