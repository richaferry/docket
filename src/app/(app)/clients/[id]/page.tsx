import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StickyNote, Phone, Mail, Users2, ArrowRightLeft, Send, CheckCircle2, Banknote } from "lucide-react";
import { db } from "@/db";
import { clients, activities, invoices } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, CLIENT_STATUS_TONE, INVOICE_STATUS_TONE } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";
import { getDisplayStatus } from "@/lib/invoices";
import { ActivityForm } from "./activity-form";

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

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = (await db.select().from(clients).where(eq(clients.id, id)).limit(1))[0];
  if (!client) notFound();

  const timeline = await db
    .select()
    .from(activities)
    .where(eq(activities.clientId, id))
    .orderBy(desc(activities.createdAt));

  const clientInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, id))
    .orderBy(desc(invoices.issueDate));

  return (
    <div>
      <PageHeader
        eyebrow="Client"
        title={client.name}
        actions={
          <>
            <LinkButton href={`/invoices/new?clientId=${client.id}`} variant="secondary" size="sm">
              New invoice
            </LinkButton>
            <LinkButton href={`/clients/${client.id}/edit`} size="sm">
              Edit
            </LinkButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 px-4 py-6 sm:px-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="font-medium text-ink">Activity</h2>
            </CardHeader>
            <ActivityForm clientId={client.id} />
            <div className="border-t border-line">
              {timeline.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-muted">Nothing logged yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {timeline.map((entry) => {
                    const Icon = ACTIVITY_ICON[entry.type];
                    return (
                      <li key={entry.id} className="flex gap-3 px-4 py-3">
                        <Icon
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="mt-0.5 shrink-0 text-ink-muted"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-ink">{entry.content}</p>
                          <p className="text-xs text-ink-muted">{formatDateTime(entry.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-medium text-ink">Invoices</h2>
            </CardHeader>
            {clientInvoices.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">No invoices for this client yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {clientInvoices.map((invoice) => {
                  const status = getDisplayStatus(invoice);
                  return (
                    <li key={invoice.id}>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-soft/40"
                      >
                        <div>
                          <p className="font-tabular text-sm text-ink">{invoice.number}</p>
                          <p className="text-xs text-ink-muted">Due {formatDate(invoice.dueDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-tabular text-sm text-ink">
                            {formatMoney(invoice.total, invoice.currency)}
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
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <h2 className="font-medium text-ink">Details</h2>
              <Badge tone={CLIENT_STATUS_TONE[client.status]}>{client.status}</Badge>
            </CardHeader>
            <CardBody className="flex flex-col gap-3 text-sm">
              <DetailRow label="Company" value={client.company} />
              <DetailRow label="Email" value={client.email} />
              <DetailRow label="Phone" value={client.phone} />
              <DetailRow label="Address" value={client.address} />
            </CardBody>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <h2 className="font-medium text-ink">Notes</h2>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-sm text-ink-muted">{client.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right text-ink">{value || "—"}</span>
    </div>
  );
}
