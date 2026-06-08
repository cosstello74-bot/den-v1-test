import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { checkRateLimit, clearRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateCsrfToken } from "@/lib/csrf";

function makeSessionToken(adminPw: string): string {
  return createHmac("sha256", adminPw).update("den-admin-session").digest("hex");
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 5 attempts per IP per 15 minutes
  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      }
    );
  }

  // CSRF validation
  const csrfToken = req.headers.get("x-csrf-token");
  if (!validateCsrfToken(csrfToken)) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const body = await req.json() as { password?: unknown };
  const password = body?.password;
  const adminPw  = process.env.ADMIN_PASSWORD;

  if (!adminPw || typeof password !== "string" || password !== adminPw) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Clear rate limit on successful login
  clearRateLimit(ip);

  const token  = makeSessionToken(adminPw);
  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });

  response.cookies.set("den_admin_auth", token, {
    httpOnly: true,
    sameSite: "strict",
    secure:   isProd,
    maxAge:   60 * 60 * 24,
    path:     "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("den_admin_auth", "", { maxAge: 0, path: "/" });
  return response;
}
