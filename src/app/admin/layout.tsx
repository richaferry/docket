import { getSuperadminSession } from "@/lib/superadmin-auth";
import { getThemePref } from "@/lib/theme";
import { AdminSidebar } from "@/components/nav/admin-sidebar";

export const dynamic = "force-dynamic";

// Admin area layout. Mirrors the tenant (app) layout: the sidebar shell with
// collapse + mobile drawer + account menu, so the /admin experience matches
// the workspace. The /admin/login page renders without the sidebar.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSuperadminSession();

  if (session) {
    const initialPref = await getThemePref();
    return (
      <div className="flex min-h-screen w-full flex-col md:flex-row">
        <AdminSidebar email={session.email} initialPref={initialPref} />
        <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
      {children}
    </main>
  );
}
