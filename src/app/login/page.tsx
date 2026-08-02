import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSignupDisabled } from "@/lib/env";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

// Reads the session cookie; must render per-request, not be prerendered at
// build time (which would hit the database).
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect("/app");
  }

  const params = await searchParams;
  const notice = params.reset === "1"
    ? "Password updated. You can sign in now."
    : null;

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-left">
            <p className="font-display text-2xl text-ink">Docket</p>
            <p className="mt-1 text-sm text-ink-muted">Sign in to your workspace.</p>
          </div>
          <ThemeToggle />
        </div>
        <LoginForm notice={notice} signupEnabled={!isSignupDisabled()} />
      </div>
    </main>
  );
}
