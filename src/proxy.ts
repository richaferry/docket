import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/admin/login",
];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/i/")) return true; // shareable client-facing invoice link
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  return false;
}

// Optimistic check only (no DB access — proxy runs on the Edge runtime, and
// cookie *presence* doesn't mean the session is actually valid — e.g. after
// authSecret changes, a stale cookie is still "present"). The authoritative
// check happens server-side via getSession(): the (app) layout for protected
// routes, and the /login page itself for the redirect-away-if-already-logged-in
// case. Redirecting away from /login based on presence alone would loop
// forever against an invalid cookie, so this middleware never does that.
// /admin routes use the separate superadmin cookie (admin_session) — the same
// presence-only fast-path, with requireSuperadmin() as the real gate.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!request.cookies.has("admin_session")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (!request.cookies.has("session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.\\w+$).*)"],
};
