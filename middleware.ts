/**
 * DEN Middleware
 *
 * 1. Geo-restriction: /beauty/* is a UK-only booking service (Mikki's Wax Bar, London).
 *    Non-GB visitors are redirected to the homepage.
 *    x-vercel-ip-country is injected by Vercel edge. On localhost this header is absent —
 *    Beauty pages will redirect to / unless: document.cookie = "den_uk_override=1"
 *
 * 2. Admin auth: /admin/* requires a valid den_admin_auth cookie.
 *    Set ADMIN_PASSWORD in your environment variables.
 *    Login at /admin/login.
 */

import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Beauty: UK-only geo restriction ────────────────────────────────────────
  if (pathname.startsWith("/beauty")) {
    const country     = req.headers.get("x-vercel-ip-country") ?? "";
    const devOverride = req.cookies.get("den_uk_override")?.value === "1";

    if (country !== "GB" && !devOverride) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── Admin: password protection ──────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("den_admin_auth")?.value;
    const pw    = process.env.ADMIN_PASSWORD;

    const valid = pw && token && token === Buffer.from(pw).toString("base64");

    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/beauty/:path*", "/admin", "/admin/:path*"],
};
