import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthSecret } from "@/lib/env";

// Platform operator sessions, fully separate from tenant sessions. A
// superadmin has no workspace of their own — they log in at /admin/login and
// their JWT is signed with the platform AUTH_SECRET (like the pre-session auth
// tokens in platform-auth.ts) instead of a tenant auth secret. Uses its own
// cookie name so it can't collide with, or be forged from, a tenant session.

const ADMIN_SESSION_COOKIE = "admin_session";
const ADMIN_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

const secretKey = () => new TextEncoder().encode(getAuthSecret());

export async function createSuperadminSession(email: string) {
  const token = await new SignJWT({ type: "superadmin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  });
}

export async function destroySuperadminSession() {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function getSuperadminSession(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type !== "superadmin") return null;
    const { email } = payload;
    if (typeof email !== "string") return null;
    return { email };
  } catch {
    return null;
  }
}

// Authoritative guard for /admin pages and actions. proxy.ts only checks
// cookie *presence* (no DB/JWT verification on the Edge runtime); this is the
// real check that runs server-side.
export async function requireSuperadmin() {
  const session = await getSuperadminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
