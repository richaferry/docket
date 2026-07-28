"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { currencySymbol } from "@/lib/currencies";

function stripToRaw(input: string): string {
  let out = "";
  let seenDot = false;
  for (const ch of input) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
    } else if (ch === "." && !seenDot) {
      out += ".";
      seenDot = true;
    }
  }
  return out;
}

function formatRaw(raw: string): string {
  if (raw === "") return "";
  const dotIndex = raw.indexOf(".");
  const intPart = dotIndex === -1 ? raw : raw.slice(0, dotIndex);
  const decPart = dotIndex === -1 ? undefined : raw.slice(dotIndex + 1, dotIndex + 3);
  const normalizedInt = intPart.replace(/^0+(?=\d)/, "") || "0";
  const grouped = normalizedInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (dotIndex === -1) return grouped;
  return `${grouped}.${decPart ?? ""}`;
}

function toNumber(raw: string): number {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function digitCountBefore(str: string, pos: number): number {
  let count = 0;
  for (let i = 0; i < pos && i < str.length; i++) {
    if (str[i] >= "0" && str[i] <= "9") count++;
  }
  return count;
}

function positionForDigitCount(str: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] >= "0" && str[i] <= "9") {
      count++;
      if (count === digitCount) return i + 1;
    }
  }
  return str.length;
}

/**
 * A money amount input that live-formats with thousands separators and a
 * leading currency symbol as the user types, while the value passed to
 * onValueChange (and the optional hidden input for form submission) stays a
 * plain number — no parsing gymnastics needed by callers.
 */
export function CurrencyInput({
  id,
  name,
  value,
  onValueChange,
  currency,
  placeholder,
  required,
  bare = false,
  className,
}: {
  id?: string;
  name?: string;
  value: number;
  onValueChange: (value: number) => void;
  currency: string;
  placeholder?: string;
  required?: boolean;
  /** Renders without border/background, for use inside table cells that already provide their own chrome. */
  bare?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState(() => (value ? String(value) : ""));
  const [display, setDisplay] = useState(() => formatRaw(raw));

  // Reflect external resets (e.g. switching invoices) without clobbering
  // what the user is actively typing.
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    const nextRaw = value ? String(value) : "";
    setRaw(nextRaw);
    setDisplay(formatRaw(nextRaw));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const cursorPos = input.selectionStart ?? input.value.length;
    const digitsBefore = digitCountBefore(input.value, cursorPos);

    const newRaw = stripToRaw(input.value);
    const newDisplay = formatRaw(newRaw);

    setRaw(newRaw);
    setDisplay(newDisplay);
    onValueChange(toNumber(newRaw || "0"));

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newPos = positionForDigitCount(newDisplay, digitsBefore);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    });
  }

  const symbol = currencySymbol(currency);

  return (
    <span className={cn("relative flex items-center", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-3 font-tabular text-sm",
          bare ? "text-ink-muted" : "text-ink-muted",
        )}
      >
        {symbol}
      </span>
      <input
        ref={inputRef}
        id={id}
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={cn(
          "w-full font-tabular text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none",
          symbol.length > 1 ? "pl-8" : "pl-6",
          bare
            ? "bg-transparent"
            : "h-9 rounded-[var(--radius)] border border-line bg-paper-raised py-2 pr-3 transition-colors focus:border-accent/50 focus:ring-2 focus:ring-accent/30",
        )}
      />
      {name && <input type="hidden" name={name} value={raw || "0"} />}
    </span>
  );
}
