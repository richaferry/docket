import { redirect } from "next/navigation";
import { getSession, requireSession } from "@/lib/auth";
import { isOnboarded, getSettings } from "@/lib/settings";
import { Sidebar } from "@/components/nav/sidebar";

// Everything under /(app) is behind auth and renders per-request. Marking the
// segment dynamic stops `next build` from prerendering these pages (which
// would query the database at build time and require a reachable Postgres
// just to build the Docker image).
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isOnboarded())) {
    redirect("/setup");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { tenantId } = await requireSession();
  const settings = await getSettings(tenantId);

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar businessName={settings.businessName} />
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
