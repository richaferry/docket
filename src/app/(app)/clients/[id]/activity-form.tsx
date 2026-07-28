"use client";

import { useActionState, useRef, useEffect } from "react";
import { addActivity } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";

export function ActivityForm({ clientId }: { clientId: string }) {
  const action = addActivity.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="activity-type">
          Activity type
        </label>
        <Select id="activity-type" name="type" className="w-full shrink-0 sm:w-32" defaultValue="note">
          <option value="note">Note</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
        </Select>
        <label className="sr-only" htmlFor="activity-content">
          Log a note, call, or meeting
        </label>
        <Textarea
          id="activity-content"
          name="content"
          placeholder="Log a note, call, or meeting…"
          rows={2}
          className="flex-1"
          required
        />
      </div>
      {state?.error && <p role="alert" className="text-xs text-danger">{state.error}</p>}
      <div>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Logging…" : "Log activity"}
        </Button>
      </div>
    </form>
  );
}
