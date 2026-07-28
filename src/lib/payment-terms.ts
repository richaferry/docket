export const PAYMENT_TERMS = [
  { value: "due_on_receipt", label: "Due on receipt", days: 0 },
  { value: "net_7", label: "Net 7", days: 7 },
  { value: "net_14", label: "Net 14", days: 14 },
  { value: "net_30", label: "Net 30", days: 30 },
  { value: "net_45", label: "Net 45", days: 45 },
  { value: "net_60", label: "Net 60", days: 60 },
  { value: "custom", label: "Custom", days: null },
] as const;

export type PaymentTermsValue = (typeof PAYMENT_TERMS)[number]["value"];

export function paymentTermsDays(value: string): number | null {
  return PAYMENT_TERMS.find((t) => t.value === value)?.days ?? null;
}

export function paymentTermsLabel(value: string): string {
  return PAYMENT_TERMS.find((t) => t.value === value)?.label ?? "Custom";
}
