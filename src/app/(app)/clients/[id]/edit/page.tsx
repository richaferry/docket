import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { PageHeader } from "@/components/page-header";
import { updateClient } from "@/actions/clients";
import { ClientForm } from "../../client-form";
import { DeleteClientButton } from "./delete-button";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = db.select().from(clients).where(eq(clients.id, id)).get();
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
        <ClientForm action={action} defaultValues={client} cancelHref={`/clients/${client.id}`} />
      </div>
    </div>
  );
}
