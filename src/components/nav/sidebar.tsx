"use client";

import { LayoutDashboard, Users, FileText, Settings } from "lucide-react";
import { SidebarShell, type NavLink } from "@/components/nav/sidebar-shell";
import { AccountMenu } from "@/components/nav/account-menu";
import type { ThemePref } from "@/lib/theme-client";

const links: NavLink[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/invoices", label: "Invoices", icon: FileText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function isActive(href: string, pathname: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function Sidebar({
  businessName,
  email,
  initialPref,
}: {
  businessName: string;
  email: string;
  initialPref: ThemePref;
}) {
  return (
    <SidebarShell
      brand={{ title: businessName || "Docket", subtitle: "Client & invoice workspace" }}
      links={links}
      isActive={isActive}
      account={<AccountMenu email={email} initialPref={initialPref} />}
    />
  );
}
