"use client";

import { deleteInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";

export function DeleteInvoiceButton({ id }: { id: string }) {
  const action = deleteInvoice.bind(null, id);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this draft invoice? This can't be undone.")) e.preventDefault();
      }}
    >
      <Button type="submit" variant="danger" size="sm">
        Delete draft
      </Button>
    </form>
  );
}
