import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicAuthPaths = ["/login", "/signup", "/vendor-signup", "/reset-password"];
const protectedPaths = ["/dashboard"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  const isOnPublicAuth = publicAuthPaths.some((p) => pathname.startsWith(p));
  const isOnProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isOnPublicAuth && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isOnProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
