/**
 * POST /api/v16/violations
 *
 * Persists V16 guardrail violations to Supabase.
 * Called fire-and-forget from the client-side guardrailRunner
 * when violations occur and throwOnViolation is false.
 *
 * Body: { rule: string; message: string; category?: string; data?: unknown }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  );

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  }

  try {
    const body = await req.json() as {
      rule:      string;
      message:   string;
      category?: string;
      data?:     unknown;
    };

    if (!body.rule || !body.message) {
      return NextResponse.json({ error: "rule and message required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("guardrail_violations")
      .insert({
        rule:     body.rule,
        message:  body.message,
        category: body.category ?? null,
        data:     body.data ?? null,
      });

    if (error) {
      console.error("[V16 violations API]", error.message);
      return NextResponse.json({ error: "db error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
