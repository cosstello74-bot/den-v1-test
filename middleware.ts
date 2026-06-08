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

  // ── Beauty: UK-only geo restriction ────────────────────────────────────────
  if (pathname.startsWith("/beauty")) {
    const country     = req.headers.get("x-vercel-ip-country") ?? "";
    const devOverride = req.cookies.get("den_uk_override")?.value === "1";

    if (country !== "GB" && !devOverride) {
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
