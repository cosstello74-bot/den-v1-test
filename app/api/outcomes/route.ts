import { NextRequest, NextResponse } from "next/server";
import { appendEvents, readAllEvents } from "@/lib/eventStore";
import { buildTruthModel, mergeTruthModels, type TruthModel } from "@/lib/truthModel";
import type { Event, EventType } from "@/types/event";
import seedTruth from "@/data/truthModel.json";

const OUTCOME_TYPES = new Set<EventType>([
  "product_returned",
  "product_revisited",
  "conversion_confirmed",
  "conversion_failed",
]);

let runtimeTruth: TruthModel = seedTruth as TruthModel;

export async function POST(req: NextRequest) {
  try {
    const body: { events: Event[] } = await req.json();

    if (!Array.isArray(body?.events)) {
      return NextResponse.json({ error: "Expected { events: Event[] }" }, { status: 400 });
    }

    const outcomeEvents = body.events.filter((e) => OUTCOME_TYPES.has(e.type));
    if (outcomeEvents.length === 0) {
      return NextResponse.json({ error: "No valid outcome event types" }, { status: 400 });
    }

    await appendEvents(outcomeEvents);

    const allEvents = await readAllEvents();
    const derived   = buildTruthModel(allEvents);
    runtimeTruth    = mergeTruthModels(seedTruth as TruthModel, derived);

    return NextResponse.json({
      ok: true,
      processed: outcomeEvents.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process outcomes" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allEvents = await readAllEvents();
    if (allEvents.length > 0) {
      const derived = buildTruthModel(allEvents);
      runtimeTruth  = mergeTruthModels(seedTruth as TruthModel, derived);
    }
  } catch {
    // fall back to current runtimeTruth
  }
  return NextResponse.json(runtimeTruth);
}
