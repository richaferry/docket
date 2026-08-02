import { desc } from "drizzle-orm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { createInvoice } from "@/actions/invoices";
import { todayISO, daysFromNowISO } from "@/lib/utils";
import { paymentTermsDays } from "@/lib/payment-terms";
import { InvoiceForm } from "../invoice-form";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;
  const allClients = await db.select().from(clients).orderBy(desc(clients.createdAt));
  const settings = await getSettings();

  return (
    <div>
      <PageHeader eyebrow="Invoices" title="New invoice" />
      <div className="px-4 py-6 sm:px-8">
        <InvoiceForm
          action={createInvoice}
          clients={allClients}
          cancelHref="/invoices"
          defaultValues={{
            clientId: clientId ?? "",
            issueDate: todayISO(),
            dueDate: daysFromNowISO(paymentTermsDays(settings.defaultPaymentTerms) ?? 14),
            paymentTerms: settings.defaultPaymentTerms,
            currency: settings.currency,
            taxLabel: settings.taxLabel,
            taxRate: settings.defaultTaxRate,
            discount: 0,
            terms: settings.defaultTerms,
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
          }}
        />
      </div>
    </div>
  );
}
