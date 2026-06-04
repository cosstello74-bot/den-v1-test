import { getAllMetrics } from "@/lib/v2/store";
import { classifyPages } from "@/lib/v2/revenueBrain";
import { generateCandidateNodes } from "@/lib/v7/nodeGenerator";

export async function runV2Cycle(context: any) {
  const metrics = getAllMetrics();

  const { winners, losers } = classifyPages(metrics);

  console.log("Winners:", winners.length);
  console.log("Losers:", losers.length);

  // suppress bad niches
  const suppressed = new Set(losers.map(l => l.slug));

  const existingNiches = context.nodes.map((n: any) => n.niche);

  const newNodes = generateCandidateNodes(
    context.opportunities,
    context.revenuePatterns,
    context.topNodes,
    existingNiches,
    context.generation
  );

  // filter suppressed
  const filtered = newNodes.filter(
    (n: any) => !suppressed.has(n.niche)
  );

  return filtered;
}
