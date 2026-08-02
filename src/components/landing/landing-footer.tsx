import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-lg tracking-tight text-ink">Docket</p>
          <p className="mt-1 text-xs text-ink-muted">Client &amp; invoice workspace</p>
        </div>
        <nav className="flex items-center gap-7 text-sm font-medium text-ink-muted" aria-label="Footer">
          <Link href="/login" className="transition-colors hover:text-ink">
            Sign in
          </Link>
          <Link href="/register" className="transition-colors hover:text-ink">
            Start free
          </Link>
        </nav>
        <p className="font-mono text-xs text-ink-muted">© 2026 Docket</p>
      </div>
    </footer>
  );
}
