"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
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
  menuAlign = "right",
}: {
  className?: string;
  menuAlign?: "left" | "right";
}) {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const CurrentIcon = OPTIONS.find((option) => option.value === pref)?.icon ?? Monitor;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch color theme"
        title="Switch color theme"
        className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] border border-line bg-paper text-ink-muted transition-colors hover:text-ink"
      >
        <CurrentIcon size={14} strokeWidth={2} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Color theme options"
          className={cn(
            "anim-pop absolute top-full z-50 mt-1.5 min-w-[9rem] rounded-xl border border-line bg-paper-raised p-1 shadow-[0_16px_40px_-16px_rgba(22,48,63,0.4)]",
            menuAlign === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right",
          )}
        >
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={pref === value}
              onClick={() => {
                apply(value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                pref === value
                  ? "bg-accent-soft text-accent"
                  : "text-ink-muted hover:bg-neutral-soft hover:text-ink",
              )}
            >
              <Icon size={14} strokeWidth={2} aria-hidden="true" />
              <span className="flex-1 text-left">{label}</span>
              {pref === value && <Check size={13} strokeWidth={2.5} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
