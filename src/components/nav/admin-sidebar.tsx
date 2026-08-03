"use client";

import { Building2 } from "lucide-react";
import { SidebarShell, type NavLink } from "@/components/nav/sidebar-shell";
import { AccountMenu } from "@/components/nav/account-menu";
import { adminLogout } from "@/actions/admin";
import type { ThemePref } from "@/lib/theme-client";

const links: NavLink[] = [
  { href: "/admin", label: "Customers", icon: Building2 },
];

// The whole /admin area (dashboard + per-customer drill-down) belongs to the
// single Customers item; the login page is outside the sidebar layout.
function isActive(_href: string, pathname: string) {
  return pathname.startsWith("/admin");
}

export function AdminSidebar({
  email,
  initialPref,
}: {
  email: string;
  initialPref: ThemePref;
}) {
  return (
    <SidebarShell
      brand={{ title: "Docket", subtitle: "Admin" }}
      links={links}
      isActive={isActive}
      account={
        <AccountMenu
          email={email}
          initialPref={initialPref}
          subtitle="Platform admin"
          settingsHref={undefined}
          signOutAction={adminLogout}
        />
      }
    />
  );
}
