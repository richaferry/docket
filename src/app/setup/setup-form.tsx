"use client";

import { useActionState } from "react";
import { setupAccount } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function SetupForm() {
  const [state, formAction, pending] = useActionState(setupAccount, undefined);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          <Field label="Business name" htmlFor="businessName">
            <Input
              id="businessName"
              name="businessName"
              placeholder="Acme Studio"
              required
              autoFocus
            />
          </Field>
          <Field label="Your email" htmlFor="adminEmail">
            <Input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="you@studio.com"
              required
            />
          </Field>
          <Field label="Password" htmlFor="password" hint="At least 8 characters.">
            <Input id="password" name="password" type="password" minLength={8} required />
          </Field>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Setting up…" : "Create workspace"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
