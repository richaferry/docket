"use client";

import { useActionState } from "react";
import { deleteClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";

export function DeleteClientButton({ id }: { id: string }) {
  const action = deleteClient.bind(null, id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Delete this client? This can't be undone.")) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "Deleting…" : "Delete client"}
      </Button>
    </form>
  );
}
