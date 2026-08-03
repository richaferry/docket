import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { tenants, settings, clients, invoices } from "@/db/schema";
import { requireSuperadmin } from "@/lib/superadmin-auth";
import { PageHeader } from "@/components/page-header";
import { Badge, INVOICE_STATUS_TONE, CLIENT_STATUS_TONE } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/utils";
import { getDisplayStatus } from "@/lib/invoices";

export const dynamic = "force-dynamic";

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  await requireSuperadmin();
  const { tenantId } = await params;

  const tenant = (
    await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  )[0];
  if (!tenant) notFound();

  const [settingsRow, clientRows, invoiceRows] = await Promise.all([
    db.select().from(settings).where(eq(settings.tenantId, tenantId)).limit(1),
    db.select().from(clients).where(eq(clients.tenantId, tenantId)).orderBy(desc(clients.createdAt)),
    db.select().from(invoices).where(eq(invoices.tenantId, tenantId)).orderBy(desc(invoices.issueDate)),
  ]);

  const business = settingsRow[0];
  const name = business?.businessName?.trim() || tenant.adminEmail;
  const clientById = new Map(clientRows.map((c) => [c.id, c]));

  return (
    <div>
      <PageHeader
        eyebrow={tenant.adminEmail}
        title={name}
        actions={
          <Link
            href="/admin"
            className="text-sm text-ink-muted hover:text-accent"
          >
            ← All customers
          </Link>
        }
      />

      <div className="flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8">
        <section aria-labelledby="clients-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="clients-heading" className="font-medium text-ink">
              Clients
            </h2>
            <span className="text-xs text-ink-muted">{clientRows.length}</span>
          </div>
          {clientRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-ink-muted">
              No clients yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-neutral-soft/50 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Name</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientRows.map((client) => (
                    <tr key={client.id} className="border-b border-line last:border-0 hover:bg-neutral-soft/40">
                      <td className="px-4 py-3">
                        <p className="text-ink">{client.company || client.name}</p>
                        {client.company && <p className="text-xs text-ink-muted">{client.name}</p>}
                      </td>
                      <td className="hidden px-4 py-3 font-tabular text-ink-muted sm:table-cell">
                        {client.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={CLIENT_STATUS_TONE[client.status]}>{client.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="invoices-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="invoices-heading" className="font-medium text-ink">
              Invoices
            </h2>
            <span className="text-xs text-ink-muted">{invoiceRows.length}</span>
          </div>
          {invoiceRows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line py-10 text-center text-sm text-ink-muted">
              No invoices yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-neutral-soft/50 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                    <th scope="col" className="px-4 py-3 font-medium">Number</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Client</th>
                    <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Issued</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceRows.map((invoice) => {
                    const client = clientById.get(invoice.clientId);
                    return (
                      <tr key={invoice.id} className="border-b border-line last:border-0 hover:bg-neutral-soft/40">
                        <td className="px-4 py-3">
                          <Link
                            href={`/i/${invoice.publicId}`}
                            className="font-tabular font-medium text-ink hover:text-accent"
                          >
                            {invoice.number}
                          </Link>
                          <span className="block text-xs text-ink-muted">public view</span>
                        </td>
                        <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">
                          {client?.name ?? "—"}
                        </td>
                        <td className="hidden px-4 py-3 text-ink-muted md:table-cell">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={INVOICE_STATUS_TONE[getDisplayStatus(invoice)]}>
                            {getDisplayStatus(invoice)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-tabular">
                          {formatMoney(invoice.total, invoice.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
