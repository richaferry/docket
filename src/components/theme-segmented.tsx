"use client";

import { Monitor, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyTheme, useThemePref, type ThemePref } from "@/lib/theme-client";

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

// Vercel-style segmented control: one visible System / Light / Dark pill set,
// no dropdown. Used inside the sidebar account menu.
export function ThemeSegmented({ initialPref }: { initialPref: ThemePref }) {
  const pref = useThemePref(initialPref);

  return (
    <div
      role="radiogroup"
      aria-label="Display theme"
      className="flex items-center gap-0.5 rounded-full border border-line bg-paper p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          title={label}
          onClick={() => applyTheme(value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium transition-colors",
            pref === value
              ? "bg-paper-raised text-ink shadow-[0_0_0_1px_var(--line)]"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <Icon size={13} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
