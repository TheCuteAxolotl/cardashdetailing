import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "./src/lib/auth";
import { OWNER_EMAIL } from "./src/lib/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  const auth = token ? verifyToken(token) : null;

  if (pathname.startsWith("/api/") || pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  if ((pathname === "/login" || pathname === "/register") && auth) {
    const redirectTo = auth.email === OWNER_EMAIL ? "/owner/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (pathname === "/dashboard" || pathname.startsWith("/owner")) {
    if (!auth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname.startsWith("/owner") && auth.email !== OWNER_EMAIL) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/owner/:path*", "/login", "/register"],
};
