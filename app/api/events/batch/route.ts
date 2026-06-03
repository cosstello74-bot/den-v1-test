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

function persistModel(model: IntelligenceModel): void {
  try {
    const fs   = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const p = path.join(process.cwd(), "data", "intelligenceModel.json");
    fs.writeFileSync(p, JSON.stringify(model, null, 2));
  } catch {
    // Read-only filesystem — in-memory model remains valid
  }
}

function persistTruth(model: TruthModel): void {
  try {
    const fs   = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");
    const p = path.join(process.cwd(), "data", "truthModel.json");
    fs.writeFileSync(p, JSON.stringify(model, null, 2));
  } catch {
    // Read-only filesystem — in-memory model remains valid
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: BatchPayload = await req.json();

    if (!Array.isArray(body?.events)) {
      return NextResponse.json({ error: "Expected { events: Event[] }" }, { status: 400 });
    }

    // 1. Append to event store (idempotent)
    appendEvents(body.events);

    // 2. Re-derive intelligence and truth from full event stream
    const allEvents = readAllEvents();
    const derived   = processEventBatch(allEvents);
    runtimeModel    = mergeIntelligence(seedModel as IntelligenceModel, derived);

    const derivedTruth = buildTruthModel(allEvents);
    runtimeTruth       = mergeTruthModels(seedTruth as TruthModel, derivedTruth);

    // 3. Persist both models (best-effort)
    persistModel(runtimeModel);
    persistTruth(runtimeTruth);

    return NextResponse.json({
      ok: true,
      processed: body.events.length,
      totalEvents: allEvents.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process batch" }, { status: 500 });
  }
}

// Admin / results page fetches live intelligence model here
export async function GET() {
  try {
    const allEvents = readAllEvents();
    if (allEvents.length > 0) {
      const derived   = processEventBatch(allEvents);
      runtimeModel    = mergeIntelligence(seedModel as IntelligenceModel, derived);

      const derivedTruth = buildTruthModel(allEvents);
      runtimeTruth       = mergeTruthModels(seedTruth as TruthModel, derivedTruth);
    }
  } catch {
    // fall back to current runtime models
  }
  return NextResponse.json(runtimeModel);
}
