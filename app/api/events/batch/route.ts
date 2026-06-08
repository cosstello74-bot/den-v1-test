import { NextRequest, NextResponse } from "next/server";
import { appendEvents, readAllEvents } from "@/lib/eventStore";
import { processEventBatch, mergeIntelligence, type IntelligenceModel } from "@/lib/learningEngine";
import { buildTruthModel, mergeTruthModels, type TruthModel } from "@/lib/truthModel";
import type { BatchPayload } from "@/types/event";
import seedModel from "@/data/intelligenceModel.json";
import seedTruth from "@/data/truthModel.json";

// In-memory models — persist within Node.js process lifetime
let runtimeModel: IntelligenceModel = seedModel as IntelligenceModel;
let runtimeTruth: TruthModel        = seedTruth as TruthModel;

export async function POST(req: NextRequest) {
  try {
    const body: BatchPayload = await req.json();

    if (!Array.isArray(body?.events)) {
      return NextResponse.json({ error: "Expected { events: Event[] }" }, { status: 400 });
    }

    // 1. Persist events (Supabase when configured, in-memory fallback otherwise)
    await appendEvents(body.events);

    // 2. Re-derive intelligence and truth from full event stream
    const allEvents = await readAllEvents();
    const derived   = processEventBatch(allEvents);
    runtimeModel    = mergeIntelligence(seedModel as IntelligenceModel, derived);

    const derivedTruth = buildTruthModel(allEvents);
    runtimeTruth       = mergeTruthModels(seedTruth as TruthModel, derivedTruth);

    return NextResponse.json({
      ok: true,
      processed: body.events.length,
      totalEvents: allEvents.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[events/batch] POST error:", message);
    return NextResponse.json({ error: "Failed to process batch", detail: message }, { status: 500 });
  }
}

// Admin / results page fetches live intelligence model here
export async function GET() {
  try {
    const allEvents = await readAllEvents();
    if (allEvents.length > 0) {
      const derived   = processEventBatch(allEvents);
      runtimeModel    = mergeIntelligence(seedModel as IntelligenceModel, derived);

      const derivedTruth = buildTruthModel(allEvents);
      runtimeTruth       = mergeTruthModels(seedTruth as TruthModel, derivedTruth);
    }
  } catch (err) {
    console.error("[events/batch] GET rebuild error:", err);
    // fall back to current runtime models
  }
  return NextResponse.json(runtimeModel);
}
