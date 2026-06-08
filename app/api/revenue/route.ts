import { NextResponse }           from "next/server";
import type { NextRequest }       from "next/server";
import type { RevenueModelSnapshot } from "@/lib/metrics/revenueMetrics";
import { updateRevenueModel, persistRevenueModel } from "@/lib/revenueLearningLoop";
import type { Event } from "@/types/event";
import seedRevenue from "@/data/revenueModel.json";

// In-memory model — persists within the Node.js process lifetime
let runtimeRevenue: RevenueModelSnapshot = seedRevenue as RevenueModelSnapshot;

export async function GET() {
  return NextResponse.json(runtimeRevenue);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { events?: unknown[] };
    if (!Array.isArray(body?.events) || body.events.length === 0) {
      return NextResponse.json({ error: "events array required" }, { status: 400 });
    }

    const updated = updateRevenueModel(body.events as Event[], runtimeRevenue);
    runtimeRevenue = updated;
    persistRevenueModel(updated);

    return NextResponse.json({ ok: true, generatedAt: updated.generatedAt });
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
