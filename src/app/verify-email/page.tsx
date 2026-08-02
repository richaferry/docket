import { ThemeToggle } from "@/components/theme-toggle";
import { VerifyEmailForm } from "./verify-email-form";

// Reads the verification token from the query string; must render per-request.
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-left">
            <p className="font-display text-2xl text-ink">Docket</p>
            <p className="mt-1 text-sm text-ink-muted">Confirm your email.</p>
          </div>
          <ThemeToggle />
        </div>
        {token ? <VerifyEmailForm token={token} /> : (
          <p className="text-sm text-ink-muted">
            This link is missing its verification token. Check your inbox and
            click the full link we sent you.
          </p>
        )}
      </div>
    </main>
  );
}
