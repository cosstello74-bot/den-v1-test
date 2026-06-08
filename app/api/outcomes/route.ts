import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendEvents, readAllEvents } from "@/lib/eventStore";
import { buildTruthModel, mergeTruthModels, type TruthModel } from "@/lib/truthModel";
import type { EventType } from "@/types/event";
import seedTruth from "@/data/truthModel.json";

const EventSchema = z.object({
  id:        z.string(),
  timestamp: z.number(),
  sessionId: z.string(),
  type:      z.string(),
  category:  z.string(),
  productId: z.string().optional(),
  metadata:  z.record(z.string(), z.unknown()).optional(),
});

const PayloadSchema = z.object({ events: z.array(EventSchema).min(1) });

const OUTCOME_TYPES = new Set<EventType>([
  "product_returned",
  "product_revisited",
  "conversion_confirmed",
  "conversion_failed",
]);

let runtimeTruth: TruthModel = seedTruth as TruthModel;

export async function POST(req: NextRequest) {
  try {
    const raw   = await req.json();
    const parse = PayloadSchema.safeParse(raw);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid payload", detail: parse.error.flatten() }, { status: 400 });
    }

    const outcomeEvents = parse.data.events.filter((e) => OUTCOME_TYPES.has(e.type as EventType));
    if (outcomeEvents.length === 0) {
      return NextResponse.json({ error: "No valid outcome event types" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await appendEvents(outcomeEvents as any[]);

    const allEvents = await readAllEvents();
    const derived   = buildTruthModel(allEvents);
    runtimeTruth    = mergeTruthModels(seedTruth as TruthModel, derived);

    return NextResponse.json({
      ok: true,
      processed: outcomeEvents.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[outcomes] POST error:", message);
    return NextResponse.json({ error: "Failed to process outcomes", detail: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allEvents = await readAllEvents();
    if (allEvents.length > 0) {
      const derived = buildTruthModel(allEvents);
      runtimeTruth  = mergeTruthModels(seedTruth as TruthModel, derived);
    }
  } catch (err) {
    console.error("[outcomes] GET rebuild error:", err);
    // fall back to current runtimeTruth
  }
  return NextResponse.json(runtimeTruth);
}
