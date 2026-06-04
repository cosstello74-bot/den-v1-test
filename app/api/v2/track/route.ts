import { upsertMetrics } from "@/lib/v2/store";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.slug) {
    return Response.json({ error: "missing slug" }, { status: 400 });
  }

  await upsertMetrics(body);

  return Response.json({ ok: true });
}
