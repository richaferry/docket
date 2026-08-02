import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceItems, clients } from "@/db/schema";
import { getSettings, updateSettings } from "@/lib/settings";
import { paymentTermsLabel } from "@/lib/payment-terms";
import type { InvoicePdfData } from "@/lib/pdf/invoice-document";

export type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export function calcTotals(items: InvoiceItemInput[], taxRate: number, discount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = taxable * (taxRate / 100);
  const total = taxable + taxAmount;
  return { subtotal, taxAmount, total };
}

export async function reserveInvoiceNumber(): Promise<string> {
  const settings = await getSettings();
  const number = `${settings.invoicePrefix}${String(settings.nextInvoiceNumber).padStart(4, "0")}`;
  await updateSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 });
  return number;
}

export type DisplayStatus = "draft" | "sent" | "paid" | "overdue" | "partial" | "cancelled";

// A cent of floating-point slop is tolerated so a payment that's meant to
// settle an invoice (e.g. entered as the exact remaining balance) doesn't
// get stranded in "partial" by a rounding error.
const BALANCE_EPSILON = 0.005;

export function getDisplayStatus(invoice: {
  status: string;
  dueDate: Date | number;
  amountPaid?: number;
  total?: number;
}): DisplayStatus {
  if (invoice.status !== "sent") return invoice.status as DisplayStatus;

  const due = invoice.dueDate instanceof Date ? invoice.dueDate : new Date(invoice.dueDate);
  if (due.getTime() < Date.now()) return "overdue";

  const amountPaid = invoice.amountPaid ?? 0;
  const total = invoice.total ?? 0;
  if (amountPaid > BALANCE_EPSILON && amountPaid < total - BALANCE_EPSILON) return "partial";

  return "sent";
}

export function remainingBalance(invoice: { total: number; amountPaid: number }): number {
  return Math.max(invoice.total - invoice.amountPaid, 0);
}

export async function buildInvoicePdfData(invoiceId: string): Promise<InvoicePdfData> {
  const invoice = (await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0];
  if (!invoice) throw new Error("Invoice not found");

  const client = (await db.select().from(clients).where(eq(clients.id, invoice.clientId)).limit(1))[0];
  if (!client) throw new Error("Client not found");

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceItems.sortOrder));

  const settings = await getSettings();

  return {
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paymentTermsLabel: paymentTermsLabel(invoice.paymentTerms),
    currency: invoice.currency,
    items: items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    subtotal: invoice.subtotal,
    taxLabel: invoice.taxLabel,
    taxRate: invoice.taxRate,
    taxAmount: invoice.subtotal - invoice.discount > 0 ? (invoice.subtotal - invoice.discount) * (invoice.taxRate / 100) : 0,
    discount: invoice.discount,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    notes: invoice.notes,
    terms: invoice.terms,
    business: {
      name: settings.businessName,
      email: settings.businessEmail,
      address: settings.businessAddress,
      phone: settings.businessPhone,
      paymentInstructions: settings.paymentInstructions,
    },
    client: {
      name: client.name,
      company: client.company,
      email: client.email,
      address: client.address,
    },
  };
}

export function sumOutstanding(
  rows: { status: string; total: number; amountPaid: number; dueDate: Date | number }[],
): number {
  return rows
    .filter((r) => {
      const display = getDisplayStatus(r);
      return display === "sent" || display === "overdue" || display === "partial";
    })
    .reduce((sum, r) => sum + remainingBalance(r), 0);
}
