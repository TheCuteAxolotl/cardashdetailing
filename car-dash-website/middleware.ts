import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Allow public/API/static routes through.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // If there is no login cookie, protect dashboard pages.
  if (
    !token &&
    (pathname === "/dashboard" || pathname.startsWith("/owner"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // The owner pages/API perform the full authentication and authorization check.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/owner/:path*"],
};
