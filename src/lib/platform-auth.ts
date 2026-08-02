import { SignJWT, jwtVerify } from "jose";
import { getAuthSecret } from "@/lib/env";

// Short-lived, platform-signed tokens for auth flows that happen *before* a
// session exists: email verification and password reset. Unlike session JWTs
// (signed with the tenant's own auth secret), these are signed with the
// platform AUTH_SECRET and carry the target tenant's id in `sub`.

const secretKey = () => new TextEncoder().encode(getAuthSecret());

export type VerifyEmailTokenPayload = { tenantId: string; email: string };

export async function createEmailVerificationToken(tenantId: string, email: string): Promise<string> {
  return new SignJWT({ email, type: "verify-email" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(tenantId)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey());
}

export async function verifyEmailVerificationToken(
  token: string,
): Promise<VerifyEmailTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type !== "verify-email") return null;
    const { sub, email } = payload;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    return { tenantId: sub, email };
  } catch {
    return null;
  }
}

export async function createPasswordResetToken(tenantId: string, email: string): Promise<string> {
  return new SignJWT({ email, type: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(tenantId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secretKey());
}

export async function verifyPasswordResetToken(token: string): Promise<VerifyEmailTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.type !== "password-reset") return null;
    const { sub, email } = payload;
    if (typeof sub !== "string" || typeof email !== "string") return null;
    return { tenantId: sub, email };
  } catch {
    return null;
  }
}
