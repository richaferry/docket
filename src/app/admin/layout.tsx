import { getSuperadminSession } from "@/lib/superadmin-auth";
import { adminLogout } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSuperadminSession();

  return (
    <div className="flex min-h-screen w-full flex-col bg-paper">
      {session && (
        <header className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-8">
          <p className="font-display text-base leading-tight text-ink">Docket Admin</p>
          <div className="flex items-center gap-3">
            <span className="truncate text-xs text-ink-muted">{session.email}</span>
            <form action={adminLogout}>
              <button
                type="submit"
                className="rounded-[var(--radius)] px-2.5 py-1.5 text-sm text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
      )}
      <main id="main-content" tabIndex={-1} className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
