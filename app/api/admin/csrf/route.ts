import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";

export async function GET() {
  const token = generateCsrfToken();
  const isProd = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ csrfToken: token });
  response.cookies.set("den_csrf", token, {
    httpOnly: false, // must be readable by JS to send as header
    sameSite: "strict",
    secure: isProd,
    maxAge: 60 * 30, // 30 minutes
    path: "/",
  });

  return response;
}
