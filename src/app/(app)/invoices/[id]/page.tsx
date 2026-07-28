import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { invoices, invoiceItems, clients } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, INVOICE_STATUS_TONE } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/utils";
import { getDisplayStatus } from "@/lib/invoices";
import { paymentTermsLabel } from "@/lib/payment-terms";
import { InvoiceActions } from "./invoice-actions";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = db.select().from(invoices).where(eq(invoices.id, id)).get();
  if (!invoice) notFound();

  const client = db.select().from(clients).where(eq(clients.id, invoice.clientId)).get();
  const items = db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, id))
    .orderBy(asc(invoiceItems.sortOrder))
    .all();

  const displayStatus = getDisplayStatus(invoice);
  const taxable = Math.max(invoice.subtotal - invoice.discount, 0);
  const taxAmount = taxable * (invoice.taxRate / 100);

  return (
    <div>
      <PageHeader
        eyebrow="Invoice"
        title={invoice.number}
        actions={<InvoiceActions id={invoice.id} status={displayStatus} publicId={invoice.publicId} />}
      />

      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-wrap gap-y-2">
              <div className="flex items-center gap-3">
                <h2 className="font-medium text-ink">Line items</h2>
                <Badge tone={INVOICE_STATUS_TONE[displayStatus]}>{displayStatus}</Badge>
              </div>
              <span className="font-tabular text-lg text-accent">
                {formatMoney(invoice.total, invoice.currency)}
              </span>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th scope="col" className="px-5 py-3 font-medium">Description</th>
                    <th scope="col" className="px-3 py-3 font-medium text-right">Qty</th>
                    <th scope="col" className="px-3 py-3 font-medium text-right">Rate</th>
                    <th scope="col" className="px-5 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3">{item.description}</td>
                      <td className="px-3 py-3 text-right font-tabular text-ink-muted">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-3 text-right font-tabular text-ink-muted">
                        {formatMoney(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-5 py-3 text-right font-tabular">
                        {formatMoney(item.quantity * item.unitPrice, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-line px-5 py-4">
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
                  <span>Total</span>
                  <span className="font-tabular text-accent">
                    {formatMoney(invoice.total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {(invoice.notes || invoice.terms) && (
            <Card>
              <CardBody className="flex flex-col gap-4">
                {invoice.notes && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Terms</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{invoice.terms}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-medium text-ink">Client</h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-2 text-sm">
              {client ? (
                <>
                  <Link href={`/clients/${client.id}`} className="font-medium text-ink hover:text-accent">
                    {client.company || client.name}
                  </Link>
                  {client.company && <p className="text-ink-muted">{client.name}</p>}
                  <p className="text-ink-muted">{client.email}</p>
                </>
              ) : (
                <p className="text-ink-muted">Client not found</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-medium text-ink">Timeline</h2>
            </CardHeader>
            <CardBody className="flex flex-col gap-2 text-sm">
              <TimelineRow label="Issued" value={formatDate(invoice.issueDate)} />
              <TimelineRow label="Due" value={formatDate(invoice.dueDate)} />
              <TimelineRow label="Payment terms" value={paymentTermsLabel(invoice.paymentTerms)} />
              {invoice.sentAt && <TimelineRow label="Sent" value={formatDate(invoice.sentAt)} />}
              {invoice.paidAt && <TimelineRow label="Paid" value={formatDate(invoice.paidAt)} />}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
