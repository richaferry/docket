import { ThemeToggle } from "@/components/theme-toggle";
import { ForgotPasswordForm } from "./forgot-password-form";

// Reads onboarding state + session cookies; must render per-request.
export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-left">
            <p className="font-display text-2xl text-ink">Docket</p>
            <p className="mt-1 text-sm text-ink-muted">Reset your password.</p>
          </div>
          <ThemeToggle />
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Remembered it?{" "}
          <a href="/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </main>
  );
}
