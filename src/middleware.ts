import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

/**
 * Middleware protecting /admin/* routes.
 * Exempts /admin/login (the login page) and /api/admin/login (the login API).
 * Runs on Edge runtime — only simple cookie string comparison.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to the login page and login API without authentication
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // Check for admin cookie
  const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME);
  if (adminCookie?.value === "authenticated") {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to /admin/login
  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
