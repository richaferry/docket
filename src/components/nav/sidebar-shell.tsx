"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const SIDEBAR_COLLAPSE_KEY = "sidebar-collapsed";
const SIDEBAR_COLLAPSE_EVENT = "docket-sidebar-collapse";

function getCollapsedSnapshot(): boolean {
  return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function subscribeCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_COLLAPSE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, callback);
  };
}

function setCollapsed(value: boolean) {
  if (value) {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, "1");
  } else {
    localStorage.removeItem(SIDEBAR_COLLAPSE_KEY);
  }
  window.dispatchEvent(new Event(SIDEBAR_COLLAPSE_EVENT));
}

// Shared Vercel-style sidebar chrome: mobile topbar + drawer, desktop
// collapsible rail, and a nav list with an active state. Parameterized over
// links/brand/account so the tenant app and the /admin area get identical
// behaviour and experience without duplicating the shell.
export function SidebarShell({
  brand,
  links,
  account,
  isActive,
}: {
  brand: { title: string; subtitle: string };
  links: NavLink[];
  account: React.ReactNode;
  isActive: (href: string, pathname: string) => boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );

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
        <p className="font-display text-base leading-tight text-ink">{brand.title}</p>
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
                <p className="font-display text-lg leading-tight text-ink">{brand.title}</p>
                <p className="text-xs text-ink-muted">{brand.subtitle}</p>
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
            <NavList pathname={pathname} links={links} isActive={isActive} onNavigate={() => setOpen(false)} />
            <div className="mt-4 border-t border-line pt-3">{account}</div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-line bg-paper py-5 transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-screen",
          collapsed ? "w-16 px-2" : "w-56 px-3",
        )}
      >
        <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight text-ink">{brand.title}</p>
              <p className="text-xs text-ink-muted">{brand.subtitle}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] text-ink-muted hover:bg-neutral-soft hover:text-ink"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} aria-hidden="true" />
            )}
          </button>
        </div>
        <NavList pathname={pathname} links={links} isActive={isActive} collapsed={collapsed} />
        <div className={cn("mt-4 border-t border-line pt-3", collapsed && "flex justify-center")}>
          {account}
        </div>
      </aside>
    </>
  );
}

function NavList({
  pathname,
  links,
  isActive,
  onNavigate,
  collapsed,
}: {
  pathname: string;
  links: NavLink[];
  isActive: (href: string, pathname: string) => boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main">
      {links.map((link) => {
        const active = isActive(link.href, pathname);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? link.label : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-muted hover:bg-neutral-soft hover:text-ink",
            )}
          >
            <Icon size={16} strokeWidth={2} aria-hidden="true" />
            <span className={collapsed ? "sr-only" : undefined}>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
