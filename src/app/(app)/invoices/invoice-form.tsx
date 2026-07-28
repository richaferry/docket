"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatMoney, todayISO, daysFromNowISO } from "@/lib/utils";
import { CURRENCIES } from "@/lib/currencies";
import { PAYMENT_TERMS, paymentTermsDays } from "@/lib/payment-terms";

type ClientOption = { id: string; name: string; company: string | null };

type LineItem = { description: string; quantity: string; unitPrice: string };

type InvoiceFormValues = {
  id?: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  paymentTerms?: string;
  currency: string;
  taxLabel: string;
  taxRate: number;
  discount: number;
  notes?: string | null;
  terms?: string | null;
  items: { description: string; quantity: number; unitPrice: number }[];
};

function toDateInput(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function calcTotals(items: LineItem[], taxRate: number, discount: number) {
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0),
    0,
  );
  const taxable = Math.max(subtotal - discount, 0);
  const taxAmount = taxable * (taxRate / 100);
  const total = taxable + taxAmount;
  return { subtotal, taxAmount, total };
}

export function InvoiceForm({
  action,
  clients,
  defaultValues,
  cancelHref,
}: {
  action: (prev: unknown, formData: FormData) => Promise<{ error?: string | null } | undefined>;
  clients: ClientOption[];
  defaultValues?: InvoiceFormValues;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [items, setItems] = useState<LineItem[]>(
    defaultValues?.items.map((i) => ({
      description: i.description,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
    })) ?? [{ description: "", quantity: "1", unitPrice: "" }],
  );
  const [taxRate, setTaxRate] = useState(defaultValues?.taxRate ?? 0);
  const [discount, setDiscount] = useState(defaultValues?.discount ?? 0);
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "USD");

  const initialPaymentTerms = defaultValues?.paymentTerms ?? "net_14";
  const [paymentTerms, setPaymentTerms] = useState(initialPaymentTerms);
  const [issueDate, setIssueDate] = useState(() =>
    defaultValues ? toDateInput(defaultValues.issueDate) : toDateInput(todayISO()),
  );
  const [dueDate, setDueDate] = useState(() => {
    if (defaultValues) return toDateInput(defaultValues.dueDate);
    const days = paymentTermsDays(initialPaymentTerms) ?? 14;
    return toDateInput(daysFromNowISO(days));
  });

  const totals = useMemo(() => calcTotals(items, taxRate, discount), [items, taxRate, discount]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: "1", unitPrice: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  function handlePaymentTermsChange(value: string) {
    setPaymentTerms(value);
    const days = paymentTermsDays(value);
    if (days !== null) {
      setDueDate(addDaysToDateString(issueDate, days));
    }
  }

  function handleIssueDateChange(value: string) {
    setIssueDate(value);
    const days = paymentTermsDays(paymentTerms);
    if (days !== null) {
      setDueDate(addDaysToDateString(value, days));
    }
  }

  function handleDueDateChange(value: string) {
    setDueDate(value);
    setPaymentTerms("custom");
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((i) => ({
            description: i.description,
            quantity: Number(i.quantity) || 0,
            unitPrice: Number(i.unitPrice) || 0,
          })),
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Client" htmlFor="clientId">
          <Select id="clientId" name="clientId" defaultValue={defaultValues?.clientId ?? ""} required>
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company ? `${c.company} — ${c.name}` : c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Issue date" htmlFor="issueDate">
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            value={issueDate}
            onChange={(e) => handleIssueDateChange(e.target.value)}
            required
          />
        </Field>
        <Field label="Payment terms" htmlFor="paymentTerms">
          <Select
            id="paymentTerms"
            name="paymentTerms"
            value={paymentTerms}
            onChange={(e) => handlePaymentTermsChange(e.target.value)}
          >
            {PAYMENT_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date" htmlFor="dueDate">
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
            required
          />
        </Field>
        <Field label="Currency" htmlFor="currency">
          <Select
            id="currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Line items</p>
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>
            <Plus size={14} aria-hidden="true" /> Add row
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-neutral-soft/50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th scope="col" className="px-3 py-2 font-medium">Description</th>
                <th scope="col" className="w-24 px-3 py-2 font-medium">Qty</th>
                <th scope="col" className="w-32 px-3 py-2 font-medium">Rate</th>
                <th scope="col" className="w-32 px-3 py-2 text-right font-medium">Amount</th>
                <th scope="col" className="w-10 px-3 py-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-t border-line">
                  <td className="px-3 py-2">
                    <label className="sr-only" htmlFor={`item-description-${index}`}>
                      Item {index + 1} description
                    </label>
                    <input
                      id={`item-description-${index}`}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted/60"
                      placeholder="Design sprint, week 1"
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      required
                    />
                  </td>
                  <td className="px-3 py-2">
                    <label className="sr-only" htmlFor={`item-qty-${index}`}>
                      Item {index + 1} quantity
                    </label>
                    <input
                      id={`item-qty-${index}`}
                      type="number"
                      min="0"
                      step="any"
                      className="w-full bg-transparent text-sm outline-none font-tabular"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <label className="sr-only" htmlFor={`item-rate-${index}`}>
                      Item {index + 1} rate
                    </label>
                    <CurrencyInput
                      id={`item-rate-${index}`}
                      bare
                      currency={currency}
                      value={Number(item.unitPrice) || 0}
                      onValueChange={(v) => updateItem(index, { unitPrice: String(v) })}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-tabular text-ink">
                    {formatMoney((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), currency)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      aria-label={`Remove item ${index + 1}`}
                      className="text-ink-muted hover:text-danger"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col gap-4">
          <Field label="Tax label" htmlFor="taxLabel">
            <Input id="taxLabel" name="taxLabel" defaultValue={defaultValues?.taxLabel ?? "Tax"} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tax rate %" htmlFor="taxRate">
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                min="0"
                step="any"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Discount" htmlFor="discount">
              <CurrencyInput
                id="discount"
                name="discount"
                currency={currency}
                value={discount}
                onValueChange={setDiscount}
              />
            </Field>
          </div>
          <Field label="Notes (shown on invoice)" htmlFor="notes">
            <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes ?? ""} rows={2} />
          </Field>
          <Field label="Terms" htmlFor="terms">
            <Textarea id="terms" name="terms" defaultValue={defaultValues?.terms ?? ""} rows={2} />
          </Field>
        </div>

        <div className="flex flex-col justify-start gap-2 rounded-lg border border-line bg-neutral-soft/30 p-5">
          <Row label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
          {discount > 0 && <Row label="Discount" value={`-${formatMoney(discount, currency)}`} />}
          {taxRate > 0 && (
            <Row label={`Tax (${taxRate}%)`} value={formatMoney(totals.taxAmount, currency)} />
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <span className="font-medium text-ink">Total due</span>
            <span className="font-tabular text-lg font-medium text-accent">
              {formatMoney(totals.total, currency)}
            </span>
          </div>
        </div>
      </div>

      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : defaultValues?.id ? "Save changes" : "Create invoice"}
        </Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-tabular text-ink">{value}</span>
    </div>
  );
}
