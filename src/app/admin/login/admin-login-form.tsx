"use client";

import { useActionState } from "react";
import { adminLogin } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(adminLogin, undefined);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" name="password" type="password" required />
          </Field>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
