export function currencySymbol(code: string): string {
  try {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export const CURRENCIES = [
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "IDR", label: "IDR — Indonesian Rupiah" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "MYR", label: "MYR — Malaysian Ringgit" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "CHF", label: "CHF — Swiss Franc" },
] as const;

// Server-side validation must reject anything outside this list — the UI
// only offers a <select>, but a direct POST could otherwise store an
// invalid ISO code that later crashes every formatMoney() call for that
// row (Intl.NumberFormat throws on an unrecognized currency).
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [string, ...string[]];
