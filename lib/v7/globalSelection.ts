/**
 * v7 Global Selection Engine.
 *
 * Compares node performance across the ecosystem and applies
 * selection pressure:
 *   - Top performers get amplified (increased trafficShare)
 *   - Bottom performers get deprioritised
 *   - Middle tier maintains current allocation
 *
 * Based on Darwin-style fitness selection applied to simulated nodes.
 * Pure function — no I/O.
 */

import type { DenNode, NodeStatus } from "./ecosystemOrchestrator";
import type { DeploymentSnapshot }  from "./deploymentSimulator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectionTier = "top" | "mid" | "bottom";

export type SelectionResult = {
  nodeId:        string;
  tier:          SelectionTier;
  newStatus:     NodeStatus;
  newTrafficShare: number;
  fitnessScore:  number;
};

export type SelectionOutcome = {
  results:       SelectionResult[];
  updatedNodes:  DenNode[];
  propagationRate: number;   // fraction of nodes that changed status
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TOP_FRACTION    = 0.25;   // top 25% get amplified
const BOTTOM_FRACTION = 0.25;   // bottom 25% get deprioritised
const MAX_TRAFFIC     = 0.50;   // no single node exceeds 50% of total traffic
const MIN_TRAFFIC     = 0.02;   // no active node drops below 2%

// ─── Fitness scoring ──────────────────────────────────────────────────────────

/**
 * Composite fitness score.
 * Weighted: 50% revenue, 30% conv rate, 20% growth potential.
 */
export function computeFitness(
  node:          DenNode,
  snapshot:      DeploymentSnapshot
): number {
  const sim = snapshot.deployments.find((d) => d.nodeId === node.nodeId);
  if (!sim) return 0;

  const revNorm    = Math.min(1, sim.simulatedRevenue / 200);        // saturates at $200/mo
  const convNorm   = Math.min(1, sim.simulatedConvRate / 0.10);      // saturates at 10%
  const growthNorm = sim.growthPotential;

  return Math.round((revNorm * 0.50 + convNorm * 0.30 + growthNorm * 0.20) * 1000) / 1000;
}

// ─── Traffic redistribution ───────────────────────────────────────────────────

/**
 * Redistribute total traffic share across nodes after selection.
 * Top nodes receive a proportionally larger share.
 * All shares sum to 1.0.
 */
function redistributeTraffic(
  nodes:   DenNode[],
  results: SelectionResult[]
): Map<string, number> {
  const tierWeights: Record<SelectionTier, number> = { top: 3.0, mid: 1.0, bottom: 0.2 };
  const tierMap = new Map(results.map((r) => [r.nodeId, r.tier]));

  const totalWeight = nodes
    .filter((n) => n.status !== "deprioritised")
    .reduce((sum, n) => sum + (tierWeights[tierMap.get(n.nodeId) ?? "mid"] ?? 1.0), 0);

  const shares = new Map<string, number>();
  for (const node of nodes) {
    if (node.status === "deprioritised") { shares.set(node.nodeId, 0); continue; }
    const tier   = tierMap.get(node.nodeId) ?? "mid";
    const weight = tierWeights[tier];
    const share  = Math.max(MIN_TRAFFIC, Math.min(MAX_TRAFFIC, weight / Math.max(totalWeight, 1)));
    shares.set(node.nodeId, Math.round(share * 1000) / 1000);
  }

  return shares;
}

// ─── Main selection function ──────────────────────────────────────────────────

/**
 * Run global selection over all nodes.
 * Assigns tiers, updates statuses, redistributes traffic.
 */
export function runGlobalSelection(
  nodes:    DenNode[],
  snapshot: DeploymentSnapshot
): SelectionOutcome {
  // Score every node
  const scored = nodes.map((n) => ({ node: n, fitness: computeFitness(n, snapshot) }));
  scored.sort((a, b) => b.fitness - a.fitness);

  const n         = scored.length;
  const topCut    = Math.max(1, Math.ceil(n * TOP_FRACTION));
  const bottomCut = Math.max(1, Math.ceil(n * BOTTOM_FRACTION));

  const results: SelectionResult[] = scored.map(({ node, fitness }, i) => {
    let tier:       SelectionTier;
    let newStatus:  NodeStatus;

    if (i < topCut) {
      tier      = "top";
      newStatus = "active";
    } else if (i >= n - bottomCut) {
      tier      = "bottom";
      newStatus = node.generation > 2 ? "deprioritised" : "seeding";
    } else {
      tier      = "mid";
      newStatus = node.status === "deprioritised" ? "seeding" : node.status;
    }

    return { nodeId: node.nodeId, tier, newStatus, newTrafficShare: 0, fitnessScore: fitness };
  });

  // Redistribute traffic
  const shares = redistributeTraffic(nodes, results);
  for (const r of results) {
    r.newTrafficShare = shares.get(r.nodeId) ?? r.newTrafficShare;
  }

  // Apply to nodes
  const resultMap = new Map(results.map((r) => [r.nodeId, r]));
  const updatedNodes: DenNode[] = nodes.map((node) => {
    const r = resultMap.get(node.nodeId);
    if (!r) return node;
    return { ...node, status: r.newStatus, trafficShare: r.newTrafficShare, lastUpdatedAt: Date.now() };
  });

  const changed        = results.filter((r, i) => r.newStatus !== scored[i].node.status).length;
  const propagationRate = Math.round((changed / Math.max(nodes.length, 1)) * 100) / 100;

  return { results, updatedNodes, propagationRate };
}

/**
 * Return the top-N node ids by fitness.
 */
export function getTopNodeIds(nodes: DenNode[], snapshot: DeploymentSnapshot, limit = 3): string[] {
  return nodes
    .map((n) => ({ id: n.nodeId, fitness: computeFitness(n, snapshot) }))
    .sort((a, b) => b.fitness - a.fitness)
    .slice(0, limit)
    .map((x) => x.id);
}
