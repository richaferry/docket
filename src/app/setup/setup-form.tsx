"use client";

import { useActionState } from "react";
import { setupWorkspace } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(setupWorkspace, undefined);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          <Field
            label="Business name"
            htmlFor="businessName"
            hint="Shown on your invoices. You can change this later in Settings."
          >
            <Input
              id="businessName"
              name="businessName"
              placeholder="Acme Studio"
              required
              autoFocus
            />
          </Field>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Creating workspace…" : "Create workspace"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
