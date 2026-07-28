import { desc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { invoices, clients } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { Badge, INVOICE_STATUS_TONE } from "@/components/ui/badge";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import { getDisplayStatus, remainingBalance, type DisplayStatus } from "@/lib/invoices";
import { FileText } from "lucide-react";

const FILTERS: { label: string; value: DisplayStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Overdue", value: "overdue" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = (status as DisplayStatus | undefined) ?? "all";

  const allInvoices = db.select().from(invoices).orderBy(desc(invoices.issueDate)).all();
  const allClients = db.select().from(clients).all();
  const clientById = new Map(allClients.map((c) => [c.id, c]));

  const filtered = allInvoices.filter((invoice) => {
    if (active === "all") return true;
    return getDisplayStatus(invoice) === active;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title="Invoices"
        actions={<LinkButton href="/invoices/new">New invoice</LinkButton>}
      />

      <nav aria-label="Filter invoices by status" className="overflow-x-auto border-b border-line px-4 pt-4 sm:px-8">
        <div className="flex w-max gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "all" ? "/invoices" : `/invoices?status=${f.value}`}
              aria-current={active === f.value ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active === f.value
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="px-4 py-6 sm:px-8">
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-neutral-soft/50 text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="px-4 py-3 font-medium">Number</th>
                  <th scope="col" className="px-4 py-3 font-medium">Client</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">Due</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice) => {
                  const client = clientById.get(invoice.clientId);
                  const displayStatus = getDisplayStatus(invoice);
                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-line last:border-0 hover:bg-neutral-soft/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-tabular font-medium text-ink hover:text-accent"
                        >
                          {invoice.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{client?.name ?? "—"}</td>
                      <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{formatDate(invoice.dueDate)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={INVOICE_STATUS_TONE[displayStatus]}>{displayStatus}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-tabular">
                        {displayStatus === "partial" ? (
                          <>
                            {formatMoney(remainingBalance(invoice), invoice.currency)}
                            <span className="text-ink-muted"> / {formatMoney(invoice.total, invoice.currency)}</span>
                          </>
                        ) : (
                          formatMoney(invoice.total, invoice.currency)
                        )}
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
      <FileText className="text-ink-muted" size={28} strokeWidth={1.5} aria-hidden="true" />
      <div>
        <p className="font-display text-lg text-ink">No invoices here</p>
        <p className="text-sm text-ink-muted">Create your first invoice to get paid.</p>
      </div>
      <LinkButton href="/invoices/new" size="sm">
        New invoice
      </LinkButton>
    </div>
  );
}
