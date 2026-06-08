import { NextResponse } from "next/server";
import { createHmac } from "crypto";

function makeSessionToken(adminPw: string): string {
  return createHmac("sha256", adminPw).update("den-admin-session").digest("hex");
}

export async function POST(req: Request) {
  const { password } = await req.json() as { password: string };
  const adminPw = process.env.ADMIN_PASSWORD;

  if (!adminPw || typeof password !== "string" || password !== adminPw) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token    = makeSessionToken(adminPw);
  const isProd   = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });

  response.cookies.set("den_admin_auth", token, {
    httpOnly: true,
    sameSite: "strict",
    secure:   isProd,
    maxAge:   60 * 60 * 24, // 24 hours
    path:     "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("den_admin_auth", "", { maxAge: 0, path: "/" });
  return response;
}
