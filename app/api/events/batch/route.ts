import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appendEvents, readAllEvents } from "@/lib/eventStore";
import { processEventBatch, mergeIntelligence, type IntelligenceModel } from "@/lib/learningEngine";
import { buildTruthModel, mergeTruthModels, type TruthModel } from "@/lib/truthModel";
import { normaliseSignals } from "@/lib/v18/signalNormalizer";
import { maybeRunUpdate } from "@/lib/v18/updateScheduler";
import seedModel from "@/data/intelligenceModel.json";
import seedTruth from "@/data/truthModel.json";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const EventSchema = z.object({
  id:        z.string(),
  timestamp: z.number(),
  sessionId: z.string(),
  type:      z.string(),
  category:  z.string(),
  productId: z.string().optional(),
  metadata:  z.record(z.string(), z.unknown()).optional(),
});

const BatchPayloadSchema = z.object({
  events: z.array(EventSchema).min(1),
});

// ─── In-memory models — persist within Node.js process lifetime ──────────────

let runtimeModel: IntelligenceModel = seedModel as IntelligenceModel;
let runtimeTruth: TruthModel        = seedTruth as TruthModel;

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parse = BatchPayloadSchema.safeParse(raw);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid payload", detail: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { events } = parse.data;

    // 1. Persist events (Supabase when configured, in-memory fallback otherwise)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await appendEvents(events as any[]);

    // 2. Re-derive intelligence and truth from full event stream
    const allEvents  = await readAllEvents();
    const derived    = processEventBatch(allEvents);
    runtimeModel     = mergeIntelligence(seedModel as IntelligenceModel, derived);

    const derivedTruth = buildTruthModel(allEvents);
    runtimeTruth       = mergeTruthModels(seedTruth as TruthModel, derivedTruth);

    // 3. Feed events through v18 safety-gated learning pipeline
    const rawSignals = events.map((e) => ({
      category:  e.category,
      productId: e.productId,
      clicked:   e.type === "affiliate_clicked" || e.type === "product_clicked",
      dismissed: false,
      dwellTime: typeof e.metadata?.dwellTime === "number" ? e.metadata.dwellTime : 0,
      rank:      typeof e.metadata?.rank === "number" ? e.metadata.rank : undefined,
      timestamp: e.timestamp,
    }));
    const normalised = normaliseSignals(rawSignals);
    maybeRunUpdate(normalised);

    return NextResponse.json({
      ok:          true,
      processed:   events.length,
      totalEvents: allEvents.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[events/batch] POST error:", message);
    return NextResponse.json({ error: "Failed to process batch", detail: message }, { status: 500 });
  }
}

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
  }
  return NextResponse.json(runtimeModel);
}
