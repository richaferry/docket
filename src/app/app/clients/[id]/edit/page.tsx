import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { updateClient } from "@/actions/clients";
import { ClientForm } from "../../client-form";
import { DeleteClientButton } from "./delete-button";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await requireSession();
  const client = (
    await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.tenantId, tenantId)))
      .limit(1)
  )[0];
  if (!client) notFound();

  const action = updateClient.bind(null, client.id);

  return (
    <div>
      <PageHeader
        eyebrow="Client"
        title={`Edit ${client.name}`}
        actions={<DeleteClientButton id={client.id} />}
      />
      <div className="max-w-2xl px-4 py-6 sm:px-8">
        <ClientForm action={action} defaultValues={client} cancelHref={`/app/clients/${client.id}`} />
      </div>
    </div>
  );
}
