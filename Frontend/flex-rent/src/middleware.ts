import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicAuthPaths = [
  "/login",
  "/signup",
  "/vendor-signup",
  "/reset-password",
];
const protectedPaths = ["/dashboard", "/admin"];

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("session")?.value ||
    request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isOnPublicAuth = publicAuthPaths.some((p) => pathname.startsWith(p));
  const isOnProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isOnPublicAuth && token) {
    const role = request.cookies.get("user_role")?.value?.toUpperCase();
    const dest = role === "ADMIN" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (isOnProtected && !token) {
    // Allow admin UI in demo when only localStorage token exists (no cookie yet)
    // Still send unauthenticated cookie-less users to login for /dashboard.
    if (pathname.startsWith("/admin")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|__next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
