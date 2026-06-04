import { PageMetrics } from "@/lib/v2/types";
import type { DenNode } from "./ecosystemOrchestrator";

export function adjustConfidenceFromMetrics(
  node: DenNode,
  metrics?: PageMetrics
): number {
  if (!metrics) return node.conversionRate;

  const score =
    metrics.revenue * 0.6 +
    metrics.conversions * 0.3 -
    metrics.bounceRate * 0.5;

  return Math.max(0, Math.min(1, score));
}

export function v2AdjacencyExpansion(
  topNodes: DenNode[],
  metrics: PageMetrics[]
) {
  return topNodes.map(node => {
    const m = metrics.find(x => x.slug.includes(node.niche));

    const adjustedConfidence =
      node.conversionRate +
      (m?.revenue ?? 0) * 0.01 -
      (m?.bounceRate ?? 0) * 0.2;

    return {
      ...node,
      adjustedConfidence,
    };
  });
}
