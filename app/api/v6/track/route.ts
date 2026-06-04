import { emit } from "@/lib/v6/eventBus";
import type { V6Event } from "@/lib/v6/eventBus";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const event = body as Partial<V6Event>;

  if (!event.type || !event.slug || !event.sessionId) {
    return Response.json({ error: "missing required fields: type, slug, sessionId" }, { status: 400 });
  }

  await emit({
    type:      event.type,
    slug:      event.slug,
    sessionId: event.sessionId,
    productId: event.productId,
    value:     event.value,
    meta:      event.meta,
    timestamp: event.timestamp ?? Date.now(),
  });

  return Response.json({ ok: true });
}
