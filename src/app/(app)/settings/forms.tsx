"use client";

import { useActionState, useState } from "react";
import {
  updateBusinessProfile,
  updateInvoiceDefaults,
  updateEmailSettings,
  sendTestEmail,
  changePassword,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { Settings } from "@/lib/settings";

function SavedNote({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="text-sm text-success">
      Saved.
    </p>
  );
}

export function BusinessProfileForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateBusinessProfile, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Business name" htmlFor="businessName">
          <Input id="businessName" name="businessName" defaultValue={settings.businessName} required />
        </Field>
        <Field label="Business email" htmlFor="businessEmail">
          <Input
            id="businessEmail"
            name="businessEmail"
            type="email"
            defaultValue={settings.businessEmail}
            required
          />
        </Field>
        <Field label="Phone" htmlFor="businessPhone">
          <Input id="businessPhone" name="businessPhone" defaultValue={settings.businessPhone} />
        </Field>
        <Field label="Address" htmlFor="businessAddress">
          <Input id="businessAddress" name="businessAddress" defaultValue={settings.businessAddress} />
        </Field>
        <Field
          label="Public URL"
          htmlFor="publicUrl"
          className="col-span-2"
          hint="Where this app is reachable from the internet — used to build the client-facing invoice link in emails, e.g. https://invoices.yourdomain.com"
        >
          <Input
            id="publicUrl"
            name="publicUrl"
            type="url"
            placeholder="https://invoices.yourdomain.com"
            defaultValue={settings.publicUrl ?? ""}
          />
        </Field>
      </div>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <SavedNote show={state?.success} />
      </div>
    </form>
  );
}

export function InvoiceDefaultsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateInvoiceDefaults, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Currency" htmlFor="currency">
          <Input id="currency" name="currency" defaultValue={settings.currency} required />
        </Field>
        <Field label="Tax label" htmlFor="taxLabel">
          <Input id="taxLabel" name="taxLabel" defaultValue={settings.taxLabel} required />
        </Field>
        <Field label="Default tax rate %" htmlFor="defaultTaxRate">
          <Input
            id="defaultTaxRate"
            name="defaultTaxRate"
            type="number"
            min="0"
            step="any"
            defaultValue={settings.defaultTaxRate}
          />
        </Field>
        <Field label="Invoice prefix" htmlFor="invoicePrefix">
          <Input id="invoicePrefix" name="invoicePrefix" defaultValue={settings.invoicePrefix} required />
        </Field>
        <Field label="Next invoice number" htmlFor="nextInvoiceNumber">
          <Input
            id="nextInvoiceNumber"
            name="nextInvoiceNumber"
            type="number"
            min="1"
            defaultValue={settings.nextInvoiceNumber}
          />
        </Field>
      </div>
      <Field label="Default terms" htmlFor="defaultTerms">
        <Textarea id="defaultTerms" name="defaultTerms" defaultValue={settings.defaultTerms} rows={2} />
      </Field>
      <Field label="Payment instructions" htmlFor="paymentInstructions" hint="Bank details, PayPal, wire info — shown on every invoice.">
        <Textarea
          id="paymentInstructions"
          name="paymentInstructions"
          defaultValue={settings.paymentInstructions}
          rows={3}
        />
      </Field>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <SavedNote show={state?.success} />
      </div>
    </form>
  );
}

export function EmailSettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateEmailSettings, undefined);
  const [testState, testAction, testPending] = useActionState(sendTestEmail, undefined);
  const [provider, setProvider] = useState<"smtp" | "mailanvil">(settings.emailProvider);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div role="group" aria-label="Email provider" className="flex flex-wrap gap-2">
          {(["smtp", "mailanvil"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={provider === option}
              onClick={() => setProvider(option)}
              className={cn(
                "rounded-[var(--radius)] border px-3 py-1.5 text-sm font-medium transition-colors",
                provider === option
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-muted hover:text-ink",
              )}
            >
              {option === "smtp" ? "SMTP" : "MailAnvil"}
            </button>
          ))}
          <input type="hidden" name="emailProvider" value={provider} />
        </div>

        {provider === "smtp" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SMTP host" htmlFor="smtpHost">
              <Input id="smtpHost" name="smtpHost" defaultValue={settings.smtpHost ?? ""} placeholder="smtp.gmail.com" />
            </Field>
            <Field label="SMTP port" htmlFor="smtpPort">
              <Input id="smtpPort" name="smtpPort" type="number" defaultValue={settings.smtpPort ?? 587} />
            </Field>
            <Field label="SMTP username" htmlFor="smtpUser">
              <Input id="smtpUser" name="smtpUser" defaultValue={settings.smtpUser ?? ""} />
            </Field>
            <Field label="SMTP password" htmlFor="smtpPass">
              <Input id="smtpPass" name="smtpPass" type="password" defaultValue={settings.smtpPass ?? ""} />
            </Field>
            <Field label="From name" htmlFor="fromName">
              <Input id="fromName" name="fromName" defaultValue={settings.fromName ?? ""} />
            </Field>
            <Field label="From email" htmlFor="fromEmail">
              <Input id="fromEmail" name="fromEmail" type="email" defaultValue={settings.fromEmail ?? ""} />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="MailAnvil API key" htmlFor="mailanvilApiKey" className="col-span-2">
              <Input
                id="mailanvilApiKey"
                name="mailanvilApiKey"
                type="password"
                defaultValue={settings.mailanvilApiKey ?? ""}
                placeholder="re_..."
              />
            </Field>
            <Field label="From name" htmlFor="fromName">
              <Input id="fromName" name="fromName" defaultValue={settings.fromName ?? ""} />
            </Field>
            <Field label="From email" htmlFor="fromEmail" hint="Must be on a domain verified with MailAnvil.">
              <Input id="fromEmail" name="fromEmail" type="email" defaultValue={settings.fromEmail ?? ""} />
            </Field>
          </div>
        )}

        {provider === "smtp" && (
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="smtpSecure" defaultChecked={settings.smtpSecure} className="accent-[var(--accent)]" />
            Use SSL/TLS (port 465)
          </label>
        )}
        {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <SavedNote show={state?.success} />
        </div>
      </form>

      <form action={testAction} className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-end">
        <Field label="Send a test email to" htmlFor="testEmailTo" className="flex-1">
          <Input id="testEmailTo" name="testEmailTo" type="email" placeholder="you@studio.com" />
        </Field>
        <Button type="submit" variant="secondary" size="sm" disabled={testPending}>
          {testPending ? "Sending…" : "Send test"}
        </Button>
      </form>
      {testState?.error && <p role="alert" className="text-sm text-danger">{testState.error}</p>}
      {testState?.success && (
        <p role="status" className="text-sm text-success">
          Test email sent — check your inbox.
        </p>
      )}
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current password" htmlFor="currentPassword">
          <Input id="currentPassword" name="currentPassword" type="password" required />
        </Field>
        <Field label="New password" htmlFor="newPassword">
          <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
        </Field>
      </div>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </Button>
        <SavedNote show={state?.success} />
      </div>
    </form>
  );
}
