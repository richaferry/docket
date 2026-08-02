import type { ReactNode } from "react";

export const primaryCta =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 whitespace-nowrap";

export const ghostCta =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-paper-raised px-6 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-soft active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 whitespace-nowrap";

export const primaryCtaSm =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 whitespace-nowrap";

export function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{children}</p>
  );
}
