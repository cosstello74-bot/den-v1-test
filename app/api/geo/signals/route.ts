import { NextResponse }  from "next/server";
import type { NextRequest } from "next/server";
import type { GeoSignal }   from "@/lib/geo/geoSignals";
import fs   from "fs";
import path from "path";

const SIGNALS_PATH = path.join(process.cwd(), "data", "geoSignals.json");

// In-memory store — persists within process lifetime
let runtimeSignals: GeoSignal[] = [];

function loadSignals(): void {
  if (runtimeSignals.length > 0) return;
  try {
    const raw = fs.readFileSync(SIGNALS_PATH, "utf-8");
    runtimeSignals = (JSON.parse(raw) as { signals: GeoSignal[] }).signals ?? [];
  } catch {
    runtimeSignals = [];
  }
}

function persistSignals(): void {
  try {
    fs.writeFileSync(
      SIGNALS_PATH,
      JSON.stringify({ signals: runtimeSignals.slice(-500) }, null, 2),
      "utf-8"
    );
  } catch {
    // Vercel read-only FS — silently ignore
  }
}

export async function GET() {
  loadSignals();
  return NextResponse.json({ signals: runtimeSignals });
}

export async function POST(req: NextRequest) {
  try {
    loadSignals();
    const signal = await req.json() as GeoSignal;
    if (!signal?.sessionId || !signal?.category) {
      return NextResponse.json({ error: "invalid signal" }, { status: 400 });
    }
    runtimeSignals.push(signal);
    persistSignals();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
}
