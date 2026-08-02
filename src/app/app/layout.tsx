import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { isTenantOnboarded, getSettings } from "@/lib/settings";
import { getThemePref } from "@/lib/theme";
import { Sidebar } from "@/components/nav/sidebar";

// Everything under /(app) is behind auth and renders per-request. Marking the
// segment dynamic stops `next build` from prerendering these pages (which
// would query the database at build time and require a reachable Postgres
// just to build the Docker image).
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { tenantId } = await requireSession();

  // A signed-in user who hasn't created a workspace yet gets bounced to the
  // workspace step before the dashboard can open.
  if (!(await isTenantOnboarded(tenantId))) {
    redirect("/setup");
  }

  const settings = await getSettings(tenantId);
  const initialPref = await getThemePref();

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar businessName={settings.businessName} initialPref={initialPref} />
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
