import { ThemeToggle } from "@/components/theme-toggle";
import { ResetPasswordForm } from "./reset-password-form";

// Reads the reset token from the query string; must render per-request.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
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
            <p className="mt-1 text-sm text-ink-muted">Choose a new password.</p>
          </div>
          <ThemeToggle />
        </div>
        {token ? <ResetPasswordForm token={token} /> : (
          <p className="text-sm text-ink-muted">
            This link is missing its reset token. Check your inbox and click the
            full link we sent you.
          </p>
        )}
      </div>
    </main>
  );
}
