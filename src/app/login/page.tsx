import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isOnboarded } from "@/lib/settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (!isOnboarded()) {
    redirect("/setup");
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
            <p className="mt-1 text-sm text-ink-muted">Sign in to your workspace.</p>
          </div>
          <ThemeToggle />
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
