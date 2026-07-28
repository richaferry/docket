"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-muted hover:bg-neutral-soft hover:text-ink",
            )}
          >
            <Icon size={16} strokeWidth={2} aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
      >
        <LogOut size={16} strokeWidth={2} aria-hidden="true" />
        Sign out
      </button>
    </form>
  );
}

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close the mobile drawer on navigation. Adjusted during render (per React's
  // guidance for resetting state when a prop changes) rather than in an
  // effect, to avoid an extra render pass on every route change.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const menuButton = menuButtonRef.current;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      menuButton?.focus();
    };
  }, [open]);

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-line bg-paper px-4 py-3 md:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-ink hover:bg-neutral-soft"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <p className="font-display text-base leading-tight text-ink">{businessName || "Docket"}</p>
        <ThemeToggle />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-paper px-3 py-5"
          >
            <div className="mb-6 flex items-center justify-between px-2">
              <div>
                <p className="font-display text-lg leading-tight text-ink">
                  {businessName || "Docket"}
                </p>
                <p className="text-xs text-ink-muted">Client &amp; invoice workspace</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] text-ink-muted hover:bg-neutral-soft hover:text-ink"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <SignOutButton />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-paper px-3 py-5 md:flex">
        <div className="mb-6 px-2">
          <p className="font-display text-lg leading-tight text-ink">
            {businessName || "Docket"}
          </p>
          <p className="text-xs text-ink-muted">Client &amp; invoice workspace</p>
        </div>
        <NavLinks pathname={pathname} />
        <SignOutButton />
        <div className="mt-4 px-2">
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
