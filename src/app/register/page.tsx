import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isOnboarded } from "@/lib/settings";
import { isSignupDisabled } from "@/lib/env";
import { ThemeToggle } from "@/components/theme-toggle";
import { RegisterForm } from "./register-form";

// Reads onboarding state + session cookies; must render per-request.
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (!(await isOnboarded())) {
    redirect("/setup");
  }
  if (isSignupDisabled()) {
    redirect("/login");
  }

  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-left">
            <p className="font-display text-2xl text-ink">Docket</p>
            <p className="mt-1 text-sm text-ink-muted">Create your workspace.</p>
          </div>
          <ThemeToggle />
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
