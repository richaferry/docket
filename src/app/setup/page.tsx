import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { isTenantOnboarded } from "@/lib/settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { SetupForm } from "./setup-form";

// Reads the session + onboarding state from the database; must render
// per-request, not be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const session = await requireSession();

  if (await isTenantOnboarded(session.tenantId)) {
    redirect("/app");
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-left">
            <p className="font-display text-2xl text-ink">Docket</p>
            <p className="mt-1 text-sm text-ink-muted">
              Let&apos;s set up your workspace.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <SetupForm />
      </div>
    </main>
  );
}
