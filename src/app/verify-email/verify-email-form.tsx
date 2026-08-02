"use client";

import { useActionState } from "react";
import { verifyEmail } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(verifyEmail, undefined);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <p className="text-sm leading-relaxed text-ink">
            Click the button to verify this email address and finish setting up
            your workspace.
          </p>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Verifying…" : "Verify email"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
