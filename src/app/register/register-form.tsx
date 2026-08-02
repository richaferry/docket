"use client";

import { useActionState } from "react";
import { register } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, undefined);

  if (state?.success) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm leading-relaxed text-ink">
            Almost there! We sent a verification link to your email. Click it to
            confirm your address, then you&apos;ll create your workspace.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          <Field label="Work email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@studio.com"
              required
              autoFocus
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
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
