import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isOnboarded, getSettings } from "@/lib/settings";
import { Sidebar } from "@/components/nav/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isOnboarded()) {
    redirect("/setup");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const settings = getSettings();

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar businessName={settings.businessName} />
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
