import { and, eq, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { invoices, invoiceItems, clients } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { updateInvoice } from "@/actions/invoices";
import { InvoiceForm } from "../../invoice-form";
import { DeleteInvoiceButton } from "./delete-button";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireSession();
  const invoice = (
    await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)))
      .limit(1)
  )[0];
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(and(eq(invoiceItems.invoiceId, id), eq(invoiceItems.tenantId, tenantId)))
    .orderBy(asc(invoiceItems.sortOrder));

  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.tenantId, tenantId))
    .orderBy(desc(clients.createdAt));
  const action = updateInvoice.bind(null, invoice.id);

  return (
    <div>
      <PageHeader
        eyebrow="Invoice"
        title={`Edit ${invoice.number}`}
        actions={invoice.status === "draft" ? <DeleteInvoiceButton id={invoice.id} /> : undefined}
      />
      <div className="px-4 py-6 sm:px-8">
        <InvoiceForm
          action={action}
          clients={allClients}
          cancelHref={`/invoices/${invoice.id}`}
          defaultValues={{
            id: invoice.id,
            clientId: invoice.clientId,
            issueDate: new Date(invoice.issueDate).toISOString(),
            dueDate: new Date(invoice.dueDate).toISOString(),
            paymentTerms: invoice.paymentTerms,
            currency: invoice.currency,
            taxLabel: invoice.taxLabel,
            taxRate: invoice.taxRate,
            discount: invoice.discount,
            notes: invoice.notes,
            terms: invoice.terms,
            items: items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          }}
        />
      </div>
    </div>
  );
}
