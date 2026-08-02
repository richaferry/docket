import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, decodeJwt, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

async function getTenantSecret(tenantId: string): Promise<Uint8Array | null> {
  const row = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0];
  if (!row) return null;
  return new TextEncoder().encode(row.authSecret);
}

// Sessions are signed with the tenant's own auth secret, so we look up the
// tenant by the token's unverified `sub` claim to fetch the right key before
// verifying. A forged `sub` only causes verification to fail against the
// wrong (real) secret — the attacker never learns it.
async function getSessionSecretKey(token: string): Promise<Uint8Array | null> {
  let sub: string | undefined;
  try {
    sub = decodeJwt(token).sub;
  } catch {
    return null;
  }
  if (!sub) return null;
  return getTenantSecret(sub);
}

export async function createSession(tenantId: string, email: string) {
  const secret = await getTenantSecret(tenantId);
  if (!secret) throw new Error("Tenant not found");

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(tenantId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ tenantId: string; email: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = await getSessionSecretKey(token);
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const tenantId = payload.sub;
    const email = payload.email;
    if (typeof tenantId !== "string" || typeof email !== "string") return null;
    return { tenantId, email };
  } catch {
    return null;
  }
}

// The authoritative auth check for every Server Action and authenticated
// Route Handler. proxy.ts (Edge runtime) only checks cookie *presence* for
// UX/fast-path redirecting — it cannot verify the JWT without a DB read, so
// it must never be the only gate. Every mutating action and every handler
// serving non-public data calls this first; a missing/invalid/expired
// session redirects to /login instead of executing.
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
