import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { invoices, clients, activities, payments } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, INVOICE_STATUS_TONE } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatMoney, cn } from "@/lib/utils";
import { getDisplayStatus, remainingBalance } from "@/lib/invoices";
import {
  StickyNote,
  Phone,
  Mail,
  Users2,
  ArrowRightLeft,
  Send,
  CheckCircle2,
  Banknote,
} from "lucide-react";

const ACTIVITY_ICON = {
  note: StickyNote,
  call: Phone,
  email: Mail,
  meeting: Users2,
  status_change: ArrowRightLeft,
  invoice_sent: Send,
  invoice_paid: CheckCircle2,
  payment_received: Banknote,
};

export default async function DashboardPage() {
  const { tenantId } = await requireSession();
  const settings = await getSettings(tenantId);
  const allInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.tenantId, tenantId))
    .orderBy(desc(invoices.issueDate));
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.tenantId, tenantId));
  const recentActivity = await db
    .select()
    .from(activities)
    .where(eq(activities.tenantId, tenantId))
    .orderBy(desc(activities.createdAt))
    .limit(8);

  const withStatus = allInvoices.map((invoice) => ({ invoice, status: getDisplayStatus(invoice) }));

  const outstandingInvoices = withStatus.filter(
    (i) => i.status === "sent" || i.status === "overdue" || i.status === "partial",
  );
  const outstanding = outstandingInvoices.reduce((sum, i) => sum + remainingBalance(i.invoice), 0);

  const overdue = withStatus.filter((i) => i.status === "overdue");
  const overdueTotal = overdue.reduce((sum, i) => sum + remainingBalance(i.invoice), 0);

  const now = new Date();
  // Actual cash collected this month, not just invoices that reached "paid" —
  // a partial payment should count toward revenue the moment it's received.
  const allPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.tenantId, tenantId));
  const paidThisMonth = allPayments
    .filter(
      (p) =>
        new Date(p.paidAt).getMonth() === now.getMonth() &&
        new Date(p.paidAt).getFullYear() === now.getFullYear(),
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const activeClients = allClients.filter((c) => c.status === "active").length;

  const dueSoon = outstandingInvoices
    .sort((a, b) => new Date(a.invoice.dueDate).getTime() - new Date(b.invoice.dueDate).getTime())
    .slice(0, 5);

  const clientById = new Map(allClients.map((c) => [c.id, c]));

  return (
    <div>
      <PageHeader
        eyebrow={formatDate(now)}
        title="Overview"
        actions={
          <>
            <LinkButton href="/app/clients/new" variant="secondary" size="sm">
              New client
            </LinkButton>
            <LinkButton href="/app/invoices/new" size="sm">
              New invoice
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 px-4 py-6 sm:px-8 lg:grid-cols-4">
        <StatTile label="Outstanding" value={formatMoney(outstanding, settings.currency)} tone="accent" />
        <StatTile
          label="Overdue"
          value={formatMoney(overdueTotal, settings.currency)}
          sub={overdue.length ? `${overdue.length} invoice${overdue.length > 1 ? "s" : ""}` : undefined}
          tone={overdue.length ? "danger" : "neutral"}
        />
        <StatTile label="Paid this month" value={formatMoney(paidThisMonth, settings.currency)} tone="success" />
        <StatTile label="Active clients" value={String(activeClients)} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 pb-8 sm:px-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-medium text-ink">Payments due</h2>
            <Link href="/app/invoices" className="text-sm text-ink-muted hover:text-accent">
              View all
            </Link>
          </div>
          {dueSoon.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">
              Nothing outstanding right now.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {dueSoon.map(({ invoice, status }) => {
                const client = clientById.get(invoice.clientId);
                return (
                  <li key={invoice.id}>
                    <Link
                      href={`/app/invoices/${invoice.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-neutral-soft/40"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{client?.name ?? "—"}</p>
                        <p className="text-xs text-ink-muted">
                          {invoice.number} · Due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-tabular text-sm text-ink">
                          {formatMoney(remainingBalance(invoice), invoice.currency)}
                        </span>
                        <Badge tone={INVOICE_STATUS_TONE[status]}>{status}</Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-medium text-ink">Recent activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ink-muted">Nothing logged yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentActivity.map((entry) => {
                const client = clientById.get(entry.clientId);
                const Icon = ACTIVITY_ICON[entry.type];
                return (
                  <li key={entry.id} className="flex gap-3 px-5 py-3">
                    <Icon
                      size={15}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-ink-muted"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink">{entry.content}</p>
                      <p className="text-xs text-ink-muted">
                        {client?.name ?? "—"} · {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "accent" | "success" | "danger" | "neutral";
}) {
  const toneClass = {
    accent: "text-accent",
    success: "text-success",
    danger: "text-danger",
    neutral: "text-ink",
  }[tone];

  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className={cn("mt-2 font-tabular text-2xl", toneClass)}>{value}</p>
        {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
      </CardBody>
    </Card>
  );
}
