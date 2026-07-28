import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { invoices, invoiceItems, clients } from "@/db/schema";
import { getSettings, updateSettings } from "@/lib/settings";
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

export function reserveInvoiceNumber(): string {
  const settings = getSettings();
  const number = `${settings.invoicePrefix}${String(settings.nextInvoiceNumber).padStart(4, "0")}`;
  updateSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 });
  return number;
}

export type DisplayStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export function getDisplayStatus(invoice: {
  status: string;
  dueDate: Date | number;
}): DisplayStatus {
  if (invoice.status === "sent") {
    const due = invoice.dueDate instanceof Date ? invoice.dueDate : new Date(invoice.dueDate);
    if (due.getTime() < Date.now()) return "overdue";
  }
  return invoice.status as DisplayStatus;
}

export function buildInvoicePdfData(invoiceId: string): InvoicePdfData {
  const invoice = db.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
  if (!invoice) throw new Error("Invoice not found");

  const client = db.select().from(clients).where(eq(clients.id, invoice.clientId)).get();
  if (!client) throw new Error("Client not found");

  const items = db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceItems.sortOrder))
    .all();

  const settings = getSettings();

  return {
    number: invoice.number,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
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

export function sumOutstanding(rows: { status: string; total: number; dueDate: Date | number }[]): number {
  return rows
    .filter((r) => {
      const display = getDisplayStatus(r);
      return display === "sent" || display === "overdue";
    })
    .reduce((sum, r) => sum + r.total, 0);
}
