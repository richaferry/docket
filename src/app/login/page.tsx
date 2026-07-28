import { redirect } from "next/navigation";
import { isOnboarded } from "@/lib/settings";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  if (!isOnboarded()) {
    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-ink">Docket</p>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your workspace.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
