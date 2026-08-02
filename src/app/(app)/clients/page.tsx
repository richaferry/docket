import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { Badge, CLIENT_STATUS_TONE } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { sumOutstanding } from "@/lib/invoices";
import { Users } from "lucide-react";

export default async function ClientsPage() {
  const { tenantId } = await requireSession();
  const settings = await getSettings(tenantId);
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.tenantId, tenantId))
    .orderBy(desc(clients.createdAt));
  const allInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.tenantId, tenantId));

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Clients"
        actions={<LinkButton href="/clients/new">New client</LinkButton>}
      />

      <div className="px-4 py-6 sm:px-8">
        {allClients.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-neutral-soft/50 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Company</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {allClients.map((client) => {
                  const clientInvoices = allInvoices.filter((i) => i.clientId === client.id);
                  const outstanding = sumOutstanding(clientInvoices);
                  return (
                    <tr
                      key={client.id}
                      className="border-b border-line last:border-0 hover:bg-neutral-soft/40"
                    >
                      <td className="px-4 py-3">
                        <Link href={`/clients/${client.id}`} className="font-medium text-ink hover:text-accent">
                          {client.name}
                        </Link>
                        <p className="text-xs text-ink-muted">{client.email}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{client.company || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge tone={CLIENT_STATUS_TONE[client.status]}>{client.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-tabular">
                        {outstanding > 0 ? formatMoney(outstanding, settings.currency) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line py-20 text-center">
      <Users className="text-ink-muted" size={28} strokeWidth={1.5} aria-hidden="true" />
      <div>
        <p className="font-display text-lg text-ink">No clients yet</p>
        <p className="text-sm text-ink-muted">Add your first client to start tracking work.</p>
      </div>
      <LinkButton href="/clients/new" size="sm">
        New client
      </LinkButton>
    </div>
  );
}
