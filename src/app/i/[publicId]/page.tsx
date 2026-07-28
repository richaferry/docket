import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { invoices, invoiceItems, clients } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { getDisplayStatus } from "@/lib/invoices";
import { Badge, INVOICE_STATUS_TONE } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/utils";
import { Download } from "lucide-react";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const invoice = db.select().from(invoices).where(eq(invoices.publicId, publicId)).get();
  if (!invoice) notFound();

  const client = db.select().from(clients).where(eq(clients.id, invoice.clientId)).get();
  const items = db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id))
    .orderBy(asc(invoiceItems.sortOrder))
    .all();

  const settings = getSettings();
  const displayStatus = getDisplayStatus(invoice);
  const taxable = Math.max(invoice.subtotal - invoice.discount, 0);
  const taxAmount = taxable * (invoice.taxRate / 100);

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-lg border border-line bg-paper-raised">
        <div className="flex items-start justify-between border-b border-line px-8 py-6">
          <div>
            <p className="font-display text-xl text-ink">{settings.businessName}</p>
            {settings.businessEmail && <p className="text-sm text-ink-muted">{settings.businessEmail}</p>}
          </div>
          <div className="text-right">
            <p className="font-tabular text-lg text-accent">{invoice.number}</p>
            <Badge tone={INVOICE_STATUS_TONE[displayStatus]} className="mt-1">
              {displayStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-start justify-between px-8 py-6 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Bill to</p>
            <p className="mt-1 text-ink">{client?.company || client?.name}</p>
            {client?.company && <p className="text-ink-muted">{client.name}</p>}
            <p className="text-ink-muted">{client?.email}</p>
          </div>
          <div className="text-right">
            <p>
              <span className="text-ink-muted">Issued </span>
              {formatDate(invoice.issueDate)}
            </p>
            <p>
              <span className="text-ink-muted">Due </span>
              {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-8 py-3 font-medium">Description</th>
              <th className="px-3 py-3 font-medium text-right">Qty</th>
              <th className="px-3 py-3 font-medium text-right">Rate</th>
              <th className="px-8 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-line last:border-0">
                <td className="px-8 py-3">{item.description}</td>
                <td className="px-3 py-3 text-right font-tabular text-ink-muted">{item.quantity}</td>
                <td className="px-3 py-3 text-right font-tabular text-ink-muted">
                  {formatMoney(item.unitPrice, invoice.currency)}
                </td>
                <td className="px-8 py-3 text-right font-tabular">
                  {formatMoney(item.quantity * item.unitPrice, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end px-8 py-4">
          <div className="flex w-64 flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Subtotal</span>
              <span className="font-tabular">{formatMoney(invoice.subtotal, invoice.currency)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-muted">Discount</span>
                <span className="font-tabular">-{formatMoney(invoice.discount, invoice.currency)}</span>
              </div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-muted">
                  {invoice.taxLabel} ({invoice.taxRate}%)
                </span>
                <span className="font-tabular">{formatMoney(taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-line pt-1.5 font-medium">
              <span>Total due</span>
              <span className="font-tabular text-accent">
                {formatMoney(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.terms || settings.paymentInstructions) && (
          <div className="flex flex-col gap-4 border-t border-line px-8 py-6 text-sm">
            {invoice.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-ink-muted">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Terms</p>
                <p className="mt-1 whitespace-pre-wrap text-ink-muted">{invoice.terms}</p>
              </div>
            )}
            {settings.paymentInstructions && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Payment instructions
                </p>
                <p className="mt-1 whitespace-pre-wrap text-ink-muted">{settings.paymentInstructions}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end border-t border-line px-8 py-5">
          <LinkButton href={`/i/${invoice.publicId}/pdf`} variant="secondary" size="sm">
            <Download size={14} /> Download PDF
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
