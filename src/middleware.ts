import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that remain accessible while payment is closed.
// Everything else is redirected to /payment-closed.
const ALLOWED_PREFIXES = ["/admin", "/payment-closed"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAllowed = ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAllowed) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/payment-closed";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on all routes except Next.js internals and static assets.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf)$).*)",
  ],
};
