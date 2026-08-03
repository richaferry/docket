import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { tenants, settings, clients, invoices } from "@/db/schema";
import { requireSuperadmin } from "@/lib/superadmin-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/utils";
import { Users, FileText, Building2, type LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireSuperadmin();

  const [tenantRows, settingsRows, clientRows, invoiceRows] = await Promise.all([
    db.select().from(tenants).orderBy(desc(tenants.createdAt)),
    db.select().from(settings),
    db.select().from(clients),
    db.select().from(invoices),
  ]);

  const settingsByTenant = new Map(settingsRows.map((s) => [s.tenantId, s]));
  const clientsByTenant = new Map<string, number>();
  for (const c of clientRows) {
    clientsByTenant.set(c.tenantId, (clientsByTenant.get(c.tenantId) ?? 0) + 1);
  }
  const invoicesByTenant = new Map<string, number>();
  for (const i of invoiceRows) {
    invoicesByTenant.set(i.tenantId, (invoicesByTenant.get(i.tenantId) ?? 0) + 1);
  }

  const totalClients = clientRows.length;
  const totalInvoices = invoiceRows.length;
  const totalBilled = invoiceRows.reduce((sum, i) => sum + i.total, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Customers"
        actions={<span className="text-sm text-ink-muted">{tenantRows.length} tenant{tenantRows.length === 1 ? "" : "s"}</span>}
      />

      <div className="grid grid-cols-2 gap-4 px-4 py-6 sm:px-8 lg:grid-cols-4">
        <StatTile label="Customers" value={String(tenantRows.length)} icon={Building2} />
        <StatTile label="Clients" value={String(totalClients)} icon={Users} />
        <StatTile label="Invoices" value={String(totalInvoices)} icon={FileText} />
        <StatTile label="Total billed" value={formatMoney(totalBilled, "USD")} />
      </div>

      <div className="px-4 pb-8 sm:px-8">
        {tenantRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line py-16 text-center text-sm text-ink-muted">
            No customers yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-neutral-soft/50 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Created</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Clients</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Invoices</th>
                </tr>
              </thead>
              <tbody>
                {tenantRows.map((tenant) => {
                  const business = settingsByTenant.get(tenant.id);
                  const name = business?.businessName?.trim() || tenant.adminEmail;
                  const clientCount = clientsByTenant.get(tenant.id) ?? 0;
                  const invoiceCount = invoicesByTenant.get(tenant.id) ?? 0;
                  return (
                    <tr key={tenant.id} className="border-b border-line last:border-0 hover:bg-neutral-soft/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/customers/${tenant.id}`}
                          className="font-medium text-ink hover:text-accent"
                        >
                          {name}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 font-tabular text-ink-muted sm:table-cell">
                        {tenant.adminEmail}
                      </td>
                      <td className="hidden px-4 py-3 text-ink-muted md:table-cell">
                        {formatDate(tenant.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-tabular text-ink-muted">{clientCount}</td>
                      <td className="px-4 py-3 text-right font-tabular text-ink-muted">{invoiceCount}</td>
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

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
          {Icon && <Icon size={14} strokeWidth={2} aria-hidden="true" className="text-ink-muted" />}
        </div>
        <p className="mt-2 font-tabular text-2xl text-ink">{value}</p>
      </CardBody>
    </Card>
  );
}
