import { NextResponse } from "next/server";
import { readAllEvents } from "@/lib/eventStore";
import { buildTruthModel, mergeTruthModels, type TruthModel } from "@/lib/truthModel";
import seedTruth from "@/data/truthModel.json";

let runtimeTruth: TruthModel = seedTruth as TruthModel;

export async function GET() {
  try {
    const allEvents = readAllEvents();
    if (allEvents.length > 0) {
      const derived = buildTruthModel(allEvents);
      runtimeTruth  = mergeTruthModels(seedTruth as TruthModel, derived);
    }
  } catch {
    // fall back to seed
  }
  return NextResponse.json(runtimeTruth);
}
