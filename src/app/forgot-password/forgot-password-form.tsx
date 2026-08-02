"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPassword, undefined);

  if (state?.success) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm leading-relaxed text-ink">
            If an account exists for that email, we&apos;ve sent a password reset
            link. Check your inbox.
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
            <Input id="email" name="email" type="email" required autoFocus />
          </Field>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
