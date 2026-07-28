import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/setup"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/i/")) return true; // shareable client-facing invoice link
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  return false;
}

// Optimistic check only (no DB access — proxy runs on the Edge runtime).
// The authoritative check happens in the (app) layout via getSession().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("session");

  if (isPublic(pathname)) {
    if (pathname === "/login" && hasSession) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.\\w+$).*)"],
};
