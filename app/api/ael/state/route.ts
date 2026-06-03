import { NextResponse } from "next/server";
import fs   from "fs";
import path from "path";

const STATE_PATH = path.join(process.cwd(), "data", "ael", "expansion-state.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ lastRun: null, totalPagesGenerated: 0, totalCategoriesGenerated: 0, expansionHistory: [], currentOpportunities: [], revenueScans: [], feedbackState: { confidenceThreshold: 0.85, expansionRecords: [], avgExpansionScore: 0, lastEvaluated: null } });
  }
}
