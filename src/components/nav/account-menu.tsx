"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { ThemeSegmented } from "@/components/theme-segmented";
import type { ThemePref } from "@/lib/theme-client";

// Vercel-style account control: an avatar button pinned to the bottom of the
// sidebar that opens a menu (upward) with the workspace admin email, the
// System/Light/Dark theme switch, Settings, and Sign out. Keeps the theme
// switch reachable when the sidebar is collapsed to icons.
export function AccountMenu({
  email,
  initialPref,
  collapsed = false,
}: {
  email: string;
  initialPref: ThemePref;
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const initial = email.trim().charAt(0).toUpperCase() || "D";

  return (
    <div ref={rootRef} className={cn("relative", collapsed && "flex justify-center")}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius)] p-1.5 text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink",
          !collapsed && "w-full justify-between",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
            {initial}
          </span>
          {!collapsed && <span className="truncate text-xs">{email}</span>}
        </span>
        {!collapsed && (
          <ChevronUp size={14} className={cn("transition-transform", open && "rotate-180")} aria-hidden="true" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="anim-pop absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-line bg-paper-raised p-1.5 shadow-[0_16px_40px_-16px_rgba(27,42,33,0.4)]"
        >
          <div className="border-b border-line px-2.5 py-2">
            <p className="truncate text-xs font-medium text-ink">{email}</p>
            <p className="text-[11px] text-ink-muted">Workspace admin</p>
          </div>
          <div className="px-2.5 py-2.5">
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
              Theme
            </p>
            <ThemeSegmented initialPref={initialPref} />
          </div>
          <div className="border-t border-line p-1">
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
            >
              <Settings size={14} aria-hidden="true" />
              Settings
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
              >
                <LogOut size={14} aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
