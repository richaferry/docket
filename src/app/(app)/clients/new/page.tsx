import { PageHeader } from "@/components/page-header";
import { createClient } from "@/actions/clients";
import { ClientForm } from "../client-form";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader eyebrow="CRM" title="New client" />
      <div className="max-w-2xl px-4 py-6 sm:px-8">
        <ClientForm action={createClient} cancelHref="/clients" />
      </div>
    </div>
  );
}
