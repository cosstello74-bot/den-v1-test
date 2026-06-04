import { runCycleFromApi } from "@/lib/v14/orchestrator";
import { getAllMetrics }   from "@/lib/v2/store";
import type { CycleContext } from "@/lib/v14/orchestrator";

async function loadContext(): Promise<CycleContext> {
  const metrics = await getAllMetrics();

  // Nodes and products are loaded from persistent state in production.
  // Extend this to load from Supabase or your data layer.
  return {
    nodes:      [],
    products:   [],
    metrics,
    generation: 1,
  };
}

export async function GET() {
  const result = await runCycleFromApi(loadContext);

  return Response.json({
    ok:      result.ok,
    summary: result.summary,
  });
}
