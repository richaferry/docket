"use client";

import { useActionState } from "react";
import {
  updateBusinessProfile,
  updateInvoiceDefaults,
  changePassword,
} from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CURRENCIES } from "@/lib/currencies";
import { PAYMENT_TERMS } from "@/lib/payment-terms";
import type { Settings } from "@/lib/settings";

function SavedNote({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="text-sm text-success">
      Saved.
    </p>
  );
}

export function BusinessProfileForm({
  settings,
  publicUrl,
}: {
  settings: Settings;
  publicUrl: string | null;
}) {
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
      </div>
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <SavedNote show={state?.success} />
      </div>
      <p className="border-t border-line pt-3 text-xs text-ink-muted">
        Public URL (used for client-facing invoice links):{" "}
        {publicUrl ? (
          <span className="font-tabular text-ink">{publicUrl}</span>
        ) : (
          <span className="text-warning">not set</span>
        )}{" "}
        — configured via the <code className="font-tabular">PUBLIC_URL</code> environment variable, not
        here.
      </p>
    </form>
  );
}

export function InvoiceDefaultsForm({ settings }: { settings: Settings }) {
  const [state, formAction, pending] = useActionState(updateInvoiceDefaults, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Currency" htmlFor="currency">
          <Select id="currency" name="currency" defaultValue={settings.currency} required>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Default payment terms" htmlFor="defaultPaymentTerms">
          <Select id="defaultPaymentTerms" name="defaultPaymentTerms" defaultValue={settings.defaultPaymentTerms}>
            {PAYMENT_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
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
