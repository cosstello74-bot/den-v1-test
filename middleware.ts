/**
 * DEN Middleware
 *
 * Geo-restriction: /beauty/* is a UK-only booking service (Mikki's Wax Bar, London).
 * Non-GB visitors are redirected to the homepage.
 *
 * x-vercel-ip-country is injected by the Vercel edge network on deployed instances.
 * On localhost this header is absent — Beauty pages will redirect to /
 * unless you set a cookie: document.cookie = "den_uk_override=1"
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/beauty")) {
    const country    = req.headers.get("x-vercel-ip-country") ?? "";
    const devOverride = req.cookies.get("den_uk_override")?.value === "1";

    if (country !== "GB" && !devOverride) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/beauty/:path*"],
};
