/**
 * v7 Simulated Deployment Engine.
 *
 * Simulates multiple DEN instances across "virtual domains".
 * No actual deployment occurs — this engine models what each node's
 * performance profile would look like after deployment, applying
 * niche-specific traffic multipliers and revenue projections.
 *
 * Pure function — no I/O. All state returned to caller for persistence.
 */

import type { DenNode } from "./ecosystemOrchestrator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SimulatedDeployment = {
  nodeId:            string;
  domain:            string;
  niche:             string;
  simulatedMonthlyVisits: number;
  simulatedMonthlyCTR:   number;   // affiliate click-through rate
  simulatedConvRate:     number;   // conversion rate
  simulatedRevenue:      number;   // monthly USD equivalent
  marketSaturation:      number;   // 0–1, higher = harder to grow
  growthPotential:       number;   // 0–1
};

export type DeploymentSnapshot = {
  deployments:    SimulatedDeployment[];
  totalRevenue:   number;
  bestNodeId:     string;
  snapshotAt:     number;
};

// ─── Niche market models ──────────────────────────────────────────────────────

type NicheModel = {
  baseVisits:      number;   // monthly organic visits ceiling
  ctr:             number;   // affiliate CTR
  convRate:        number;   // conversion rate
  saturation:      number;   // market saturation 0–1
  avgOrderValue:   number;   // USD
  affiliateRate:   number;   // commission rate
};

const NICHE_MODELS: Record<string, NicheModel> = {
  "gaming laptops":         { baseVisits: 12000, ctr: 0.14, convRate: 0.04, saturation: 0.65, avgOrderValue: 1100, affiliateRate: 0.04 },
  "student laptops":        { baseVisits: 18000, ctr: 0.10, convRate: 0.03, saturation: 0.55, avgOrderValue: 650,  affiliateRate: 0.04 },
  "developer laptops":      { baseVisits: 6000,  ctr: 0.16, convRate: 0.05, saturation: 0.40, avgOrderValue: 1400, affiliateRate: 0.04 },
  "work from home laptops": { baseVisits: 9000,  ctr: 0.11, convRate: 0.035, saturation: 0.50, avgOrderValue: 900, affiliateRate: 0.04 },
  "budget laptops":         { baseVisits: 22000, ctr: 0.08, convRate: 0.025, saturation: 0.70, avgOrderValue: 380, affiliateRate: 0.04 },
  "creative laptops":       { baseVisits: 5000,  ctr: 0.13, convRate: 0.04, saturation: 0.45, avgOrderValue: 1600, affiliateRate: 0.04 },
  "gaming accessories":     { baseVisits: 8000,  ctr: 0.12, convRate: 0.05, saturation: 0.50, avgOrderValue: 120,  affiliateRate: 0.06 },
  "student tablets":        { baseVisits: 10000, ctr: 0.09, convRate: 0.03, saturation: 0.55, avgOrderValue: 500,  affiliateRate: 0.04 },
  "home office monitors":   { baseVisits: 7000,  ctr: 0.13, convRate: 0.045, saturation: 0.45, avgOrderValue: 450, affiliateRate: 0.05 },
  "refurbished laptops":    { baseVisits: 14000, ctr: 0.09, convRate: 0.03, saturation: 0.60, avgOrderValue: 320,  affiliateRate: 0.03 },
  "ai coding tools":        { baseVisits: 4000,  ctr: 0.18, convRate: 0.06, saturation: 0.25, avgOrderValue: 800,  affiliateRate: 0.04 },
  "video editing laptops":  { baseVisits: 5500,  ctr: 0.14, convRate: 0.04, saturation: 0.42, avgOrderValue: 1800, affiliateRate: 0.04 },
};

const DEFAULT_MODEL: NicheModel = {
  baseVisits: 5000, ctr: 0.10, convRate: 0.03, saturation: 0.60, avgOrderValue: 700, affiliateRate: 0.04,
};

function getNicheModel(niche: string): NicheModel {
  const lower = niche.toLowerCase();
  const exact = NICHE_MODELS[lower];
  if (exact) return exact;
  // Partial match
  for (const [key, model] of Object.entries(NICHE_MODELS)) {
    if (lower.includes(key) || key.includes(lower)) return model;
  }
  return DEFAULT_MODEL;
}

// ─── Simulation ───────────────────────────────────────────────────────────────

/**
 * Strategy modifier — revenue-optimised nodes get a revenue multiplier.
 */
function strategyMultiplier(strategy: string): { ctr: number; conv: number } {
  switch (strategy) {
    case "revenue_optimised":   return { ctr: 1.15, conv: 1.10 };
    case "engagement_weighted": return { ctr: 1.10, conv: 1.20 };
    case "relevance_first":     return { ctr: 1.05, conv: 0.95 };
    default:                    return { ctr: 1.0,  conv: 1.0  };
  }
}

/**
 * Simulate deployment metrics for a single node.
 * Performance scales with: niche model × strategy modifier × traffic share × generation decay.
 */
export function simulateNode(node: DenNode): SimulatedDeployment {
  const model   = getNicheModel(node.niche);
  const mult    = strategyMultiplier(node.baseStrategy);
  const genDecay = Math.max(0.5, 1 - node.generation * 0.10);   // each gen costs 10%

  const visits    = Math.round(model.baseVisits * node.trafficShare * genDecay);
  const ctr       = Math.min(0.30, model.ctr    * mult.ctr);
  const convRate  = Math.min(0.15, model.convRate * mult.conv);
  const clicks    = Math.round(visits * ctr);
  const convs     = Math.round(clicks * convRate);
  const revenue   = Math.round(convs * model.avgOrderValue * model.affiliateRate * 100) / 100;
  const growth    = Math.round((1 - model.saturation) * (1 - node.generation * 0.05) * 100) / 100;

  return {
    nodeId:                 node.nodeId,
    domain:                 node.domain,
    niche:                  node.niche,
    simulatedMonthlyVisits: visits,
    simulatedMonthlyCTR:    Math.round(ctr * 1000) / 1000,
    simulatedConvRate:      Math.round(convRate * 1000) / 1000,
    simulatedRevenue:       revenue,
    marketSaturation:       model.saturation,
    growthPotential:        Math.max(0, growth),
  };
}

/**
 * Simulate deployments for all nodes in the ecosystem.
 * Returns a snapshot with rankings and totals.
 */
export function simulateEcosystem(nodes: DenNode[]): DeploymentSnapshot {
  const deployments = nodes.map(simulateNode);
  const totalRevenue = Math.round(deployments.reduce((s, d) => s + d.simulatedRevenue, 0) * 100) / 100;
  const best = [...deployments].sort((a, b) => b.simulatedRevenue - a.simulatedRevenue)[0];

  return {
    deployments,
    totalRevenue,
    bestNodeId:  best?.nodeId ?? "",
    snapshotAt:  Date.now(),
  };
}

/**
 * Apply simulation results back to the node list as observed performance.
 * Updates revenueScore and conversionRate on each node.
 */
export function applySimulationToNodes(
  nodes:       DenNode[],
  snapshot:    DeploymentSnapshot
): DenNode[] {
  const byId = new Map(snapshot.deployments.map((d) => [d.nodeId, d]));
  return nodes.map((node) => {
    const sim = byId.get(node.nodeId);
    if (!sim) return node;
    return {
      ...node,
      revenueScore:   Math.round((node.revenueScore + sim.simulatedRevenue) * 100) / 100,
      conversionRate: sim.simulatedConvRate,
      lastUpdatedAt:  Date.now(),
    };
  });
}
