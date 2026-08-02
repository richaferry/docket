"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { recordPayment, deletePayment } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatDate, formatMoney, todayISO } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export function PaymentForm({
  invoiceId,
  remaining,
  currency,
}: {
  invoiceId: string;
  remaining: number;
  currency: string;
}) {
  const action = recordPayment.bind(null, invoiceId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState(0);

  // Reset the amount during render (per React's guidance for state resets on
  // prop/state change) rather than in an effect, to avoid an extra render pass.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state?.success) setAmount(0);
  }

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" htmlFor="payment-amount">
          <CurrencyInput
            id="payment-amount"
            name="amount"
            currency={currency}
            value={amount}
            onValueChange={setAmount}
            placeholder={remaining.toString()}
            required
          />
        </Field>
        <Field label="Date received" htmlFor="payment-paidAt">
          <Input id="payment-paidAt" name="paidAt" type="date" defaultValue={todayISO().slice(0, 10)} required />
        </Field>
      </div>
      <Field label="Note (optional)" htmlFor="payment-note">
        <Textarea id="payment-note" name="note" rows={1} placeholder="e.g. Bank transfer, cheque #123" />
      </Field>
      {state?.error && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Recording…" : "Record payment"}
        </Button>
        <span className="text-xs text-ink-muted">
          Balance remaining: {formatMoney(remaining, currency)}
        </span>
      </div>
    </form>
  );
}

export function PaymentList({
  invoiceId,
  payments,
  currency,
}: {
  invoiceId: string;
  payments: { id: string; amount: number; paidAt: Date | number; note: string | null }[];
  currency: string;
}) {
  if (payments.length === 0) {
    return <p className="px-4 py-4 text-center text-sm text-ink-muted">No payments recorded yet.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {payments.map((payment) => (
        <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-tabular text-sm text-ink">{formatMoney(payment.amount, currency)}</p>
            <p className="truncate text-xs text-ink-muted">
              {formatDate(payment.paidAt)}
              {payment.note ? ` · ${payment.note}` : ""}
            </p>
          </div>
          <form action={deletePayment.bind(null, invoiceId, payment.id)}>
            <button
              type="submit"
              aria-label="Delete this payment"
              className="text-ink-muted hover:text-danger"
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
