"use client";

import { useActionState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Textarea, Select } from "@/components/ui/field";

type ClientFormValues = {
  id?: string;
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  status: string;
  notes?: string | null;
};

export function ClientForm({
  action,
  defaultValues,
  cancelHref,
}: {
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string | null } | undefined>;
  defaultValues?: ClientFormValues;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact name" htmlFor="name">
          <Input id="name" name="name" defaultValue={defaultValues?.name} required autoFocus />
        </Field>
        <Field label="Company" htmlFor="company">
          <Input id="company" name="company" defaultValue={defaultValues?.company ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email} required />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={defaultValues?.status ?? "lead"}>
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <Field label="Address" htmlFor="address">
          <Input id="address" name="address" defaultValue={defaultValues?.address ?? ""} />
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} rows={4} />
      </Field>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : defaultValues?.id ? "Save changes" : "Add client"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
