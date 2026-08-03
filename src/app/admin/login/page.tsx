import { redirect } from "next/navigation";
import { getSuperadminSession } from "@/lib/superadmin-auth";
import { AdminLoginForm } from "./admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSuperadminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-paper px-4 py-12"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="font-display text-2xl text-ink">Docket</p>
          <p className="mt-1 text-sm text-ink-muted">Admin sign in</p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
