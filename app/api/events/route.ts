import { NextRequest, NextResponse } from "next/server";
import { mergeEvents, loadGlobalModel } from "@/lib/globalIntelligence";
import type { BatchEventPayload, GlobalModel } from "@/types/product";

// In-memory accumulation initialised from seed JSON.
// Persists across requests within the same Node.js process lifetime.
// On file-writable hosts (local dev, self-hosted) changes are also flushed to disk.
let runtimeModel: GlobalModel = loadGlobalModel();

export async function POST(req: NextRequest) {
  try {
    const body: BatchEventPayload = await req.json();

    if (!Array.isArray(body?.events)) {
      return NextResponse.json({ error: "Invalid payload — expected { events: [] }" }, { status: 400 });
    }

    runtimeModel = mergeEvents(runtimeModel, body.events);

    // Best-effort file persistence (works in dev / self-hosted; silent no-op on Vercel)
    try {
      const fs = await import("fs");
      const path = await import("path");
      const modelPath = path.join(process.cwd(), "data", "globalModel.json");
      fs.writeFileSync(modelPath, JSON.stringify(runtimeModel, null, 2));
    } catch {
      // Read-only filesystem — in-memory model remains valid for this process
    }

    return NextResponse.json({ ok: true, processed: body.events.length });
  } catch {
    return NextResponse.json({ error: "Failed to process events" }, { status: 500 });
  }
}

// Expose the live runtime model for the admin dashboard
export async function GET() {
  return NextResponse.json(runtimeModel);
}
