"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";

const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ businessName }: { businessName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-paper px-3 py-5">
      <div className="mb-6 px-2">
        <p className="font-display text-lg leading-tight text-ink">
          {businessName || "Docket"}
        </p>
        <p className="text-xs text-ink-muted">Client &amp; invoice workspace</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-ink-muted hover:bg-neutral-soft hover:text-ink",
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </form>
    </aside>
  );
}
