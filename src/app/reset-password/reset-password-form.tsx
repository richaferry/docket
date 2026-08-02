"use client";

import { useActionState } from "react";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <Field label="New password" htmlFor="password" hint="At least 8 characters.">
            <Input id="password" name="password" type="password" minLength={8} required autoFocus />
          </Field>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
