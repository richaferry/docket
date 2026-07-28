"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type ThemePref = "light" | "dark" | "system";

const THEME_EVENT = "docket-theme-change";

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function getSnapshot(): ThemePref {
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" ? stored : "system";
}

function getServerSnapshot(): ThemePref {
  return "system";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function apply(value: ThemePref) {
  if (value === "system") {
    localStorage.removeItem("theme");
    document.documentElement.removeAttribute("data-theme");
  } else {
    localStorage.setItem("theme", value);
    document.documentElement.setAttribute("data-theme", value);
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function ThemeToggle({
  className,
  orientation = "horizontal",
}: {
  className?: string;
  orientation?: "horizontal" | "vertical";
}) {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "flex items-center gap-0.5 rounded-[var(--radius)] border border-line bg-paper p-0.5",
        orientation === "vertical" && "flex-col",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={pref === value}
          aria-label={`${label} theme`}
          title={`${label} theme`}
          onClick={() => apply(value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[calc(var(--radius)-2px)] transition-colors",
            pref === value ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink",
          )}
        >
          <Icon size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
