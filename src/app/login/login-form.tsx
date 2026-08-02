"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card, CardBody } from "@/components/ui/card";

export function LoginForm({
  notice,
  signupEnabled,
}: {
  notice?: string | null;
  signupEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-4">
          {notice && (
            <p role="status" className="rounded-md bg-neutral-soft px-3 py-2 text-sm text-ink">
              {notice}
            </p>
          )}
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" name="password" type="password" required />
          </Field>
          <div className="text-right">
            <a href="/forgot-password" className="text-sm font-medium text-accent hover:underline">
              Forgot password?
            </a>
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-danger">
              {state.error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        {signupEnabled && (
          <p className="mt-5 text-center text-sm text-ink-muted">
            New to Docket?{" "}
            <a href="/register" className="font-medium text-accent hover:underline">
              Create an account
            </a>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
