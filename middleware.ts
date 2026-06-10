/**
 * DEN Middleware
 *
 * 1. Geo-restriction: /beauty/* is London-only (Mikki's Wax Bar is a physical salon).
 *    Human visitors outside 35km of central London are redirected to the homepage.
 *    Vercel injects x-vercel-ip-latitude/longitude at the edge at no extra cost.
 *    On localhost these headers are absent — set a cookie to bypass:
 *      document.cookie = "den_london_override=1"
 *    Search-engine crawlers are ALWAYS let through (they crawl from non-London
 *    IPs) — otherwise the page can never be indexed and local SEO is impossible.
 *
 * 2. Admin auth: /admin/* requires a valid den_admin_auth cookie.
 *    Set ADMIN_PASSWORD in your environment variables.
 *    Login at /admin/login.
 */

import { NextRequest, NextResponse } from "next/server";
import { isLondonVisitor } from "@/lib/geo/londonDetect";

// Known search-engine / social crawlers. Let through the London gate so the
// booking page is indexable and can rank for "waxing London" searches.
const CRAWLER_UA = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|sogou|exabot|facebookexternalhit|facebot|twitterbot|linkedinbot|applebot|petalbot|google-inspectiontool/i;

function isSearchCrawler(req: NextRequest): boolean {
  return CRAWLER_UA.test(req.headers.get("user-agent") ?? "");
}

// Web Crypto API — available in Edge Runtime (no Node.js crypto needed)
async function isValidToken(token: string, adminPw: string): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      enc.encode(adminPw),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode("den-admin-session"));
    const expected = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return token === expected;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Beauty: London-only geo restriction ────────────────────────────────────
  if (pathname.startsWith("/beauty")) {
    const devOverride = req.cookies.get("den_london_override")?.value === "1";
    const inLondon    = isLondonVisitor(
      req.headers.get("x-vercel-ip-latitude"),
      req.headers.get("x-vercel-ip-longitude"),
      req.headers.get("x-vercel-ip-city"),
    );

    if (!devOverride && !inLondon && !isSearchCrawler(req)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── Admin: HMAC-signed session token validation ─────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("den_admin_auth")?.value;
    const pw    = process.env.ADMIN_PASSWORD;

    const valid = pw && token && await isValidToken(token, pw);

    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/beauty/:path*", "/admin", "/admin/:path*"],
};
