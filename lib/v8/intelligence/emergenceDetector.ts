/**
 * v8 Emergent Behaviour Detector.
 *
 * Detects patterns that were NOT explicitly programmed:
 *   - Sudden category dominance (one niche capturing disproportionate attention)
 *   - Unexpected conversion clusters (niches outperforming their model baseline)
 *   - Cross-niche migration patterns (strategy vectors converging across categories)
 *   - Fitness cascade (failure of one agent causing correlated failure in others)
 *   - Monopoly formation risk (HHI trajectory)
 *
 * All detection is statistical — thresholds based on observed distributions.
 * Pure function — no I/O.
 */

import type { EconomicAgent }     from "../agents/economicAgent";
import type { AttentionMarketState } from "../markets/attentionMarket";
import type { ConversionOutput }  from "../physics/conversionPhysics";
import type { EquilibriumReport } from "../equilibrium/marketEquilibrium";
import { computeAgentFitness }    from "../agents/economicAgent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmergenceType =
  | "category_dominance"
  | "conversion_cluster"
  | "cross_niche_migration"
  | "fitness_cascade"
  | "monopoly_formation"
  | "strategy_convergence"
  | "attention_fragmentation";

export type EmergenceEvent = {
  type:        EmergenceType;
  agentIds:    string[];
  description: string;
  strength:    number;    // 0–1, how pronounced the pattern is
  tick:        number;
};

export type EmergenceReport = {
  events:          EmergenceEvent[];
  alertCount:      number;
  dominantPattern: EmergenceType | null;
};

// ─── Detection functions ──────────────────────────────────────────────────────

function detectCategoryDominance(
  agents:      EconomicAgent[],
  market:      AttentionMarketState,
  tick:        number
): EmergenceEvent | null {
  const dominant = market.allocations
    .filter((a) => a.allocatedAttention > 0.30)  // any single agent >30%
    .sort((a, b) => b.allocatedAttention - a.allocatedAttention);

  if (dominant.length === 0) return null;

  const top = dominant[0];
  const agent = agents.find((a) => a.agentId === top.agentId);

  return {
    type:        "category_dominance",
    agentIds:    [top.agentId],
    description: `"${agent?.niche ?? top.agentId}" is capturing ${(top.allocatedAttention * 100).toFixed(1)}% of all attention`,
    strength:    Math.round(Math.min(1, top.allocatedAttention / 0.40) * 1000) / 1000,
    tick,
  };
}

function detectConversionCluster(
  agents:      EconomicAgent[],
  conversions: ConversionOutput[],
  tick:        number
): EmergenceEvent | null {
  if (conversions.length === 0) return null;
  const mean = conversions.reduce((s, c) => s + c.finalConversion, 0) / conversions.length;
  const outliers = conversions.filter((c) => c.finalConversion > mean * 2.0);

  if (outliers.length < 2) return null;

  const agentIds = outliers.map((o) => o.agentId);
  const niches   = agentIds.map((id) => agents.find((a) => a.agentId === id)?.niche ?? id);

  return {
    type:        "conversion_cluster",
    agentIds,
    description: `unexpected conversion cluster: ${niches.join(", ")} converting at 2× market average`,
    strength:    Math.round(Math.min(1, outliers.length / agents.length + 0.3) * 1000) / 1000,
    tick,
  };
}

function detectCrossNicheMigration(
  agents: EconomicAgent[],
  tick:   number
): EmergenceEvent | null {
  // Detect if agents from different niches have converged to similar strategy vectors
  if (agents.length < 3) return null;

  const converging: string[] = [];
  const threshold = 0.15;   // Euclidean distance < 0.15 = converged

  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const a = agents[i], b = agents[j];
      if (a.niche === b.niche) continue;  // skip same-niche
      const dist = Math.sqrt(
        a.strategyVector.reduce((s, v, d) => s + Math.pow(v - (b.strategyVector[d] ?? 0.5), 2), 0)
      );
      if (dist < threshold) {
        if (!converging.includes(a.agentId)) converging.push(a.agentId);
        if (!converging.includes(b.agentId)) converging.push(b.agentId);
      }
    }
  }

  if (converging.length < 2) return null;

  const niches = converging.map((id) => agents.find((a) => a.agentId === id)?.niche ?? id);
  return {
    type:        "cross_niche_migration",
    agentIds:    converging,
    description: `strategy convergence across niches: ${niches.join(", ")} using near-identical vectors`,
    strength:    Math.round(Math.min(1, converging.length / agents.length + 0.2) * 1000) / 1000,
    tick,
  };
}

function detectFitnessCascade(
  agents: EconomicAgent[],
  tick:   number
): EmergenceEvent | null {
  // Detect correlated decline: >40% of agents declining simultaneously
  const declining = agents.filter((a) => {
    const h = a.fitnessHistory;
    if (h.length < 3) return false;
    return h[h.length - 1] < h[h.length - 2] && h[h.length - 2] < h[h.length - 3];
  });

  if (declining.length < agents.length * 0.4) return null;

  return {
    type:        "fitness_cascade",
    agentIds:    declining.map((a) => a.agentId),
    description: `fitness cascade: ${declining.length} of ${agents.length} agents declining simultaneously`,
    strength:    Math.round((declining.length / agents.length) * 1000) / 1000,
    tick,
  };
}

function detectMonopolyFormation(
  market: AttentionMarketState,
  tick:   number
): EmergenceEvent | null {
  if (market.hhi < 0.30) return null;

  return {
    type:        "monopoly_formation",
    agentIds:    [market.dominantAgentId],
    description: `attention monopoly forming — HHI ${market.hhi.toFixed(3)} exceeds competitive threshold (0.30)`,
    strength:    Math.round(Math.min(1, (market.hhi - 0.30) / 0.70 + 0.3) * 1000) / 1000,
    tick,
  };
}

function detectStrategyConvergence(
  agents: EconomicAgent[],
  tick:   number
): EmergenceEvent | null {
  if (agents.length < 3) return null;
  // All agents within tight band of each other
  const allVectors = agents.map((a) => a.strategyVector);
  const maxDist    = Math.max(
    ...agents.flatMap((a, i) =>
      agents.slice(i + 1).map((b) =>
        Math.sqrt(a.strategyVector.reduce((s, v, d) => s + Math.pow(v - (b.strategyVector[d] ?? 0.5), 2), 0))
      )
    )
  );

  if (maxDist > 0.25 || allVectors.length === 0) return null;

  return {
    type:        "strategy_convergence",
    agentIds:    agents.map((a) => a.agentId),
    description: `full strategy convergence — all agents within Euclidean distance ${maxDist.toFixed(3)}`,
    strength:    Math.round(Math.max(0, 1 - maxDist / 0.25) * 1000) / 1000,
    tick,
  };
}

function detectAttentionFragmentation(
  market: AttentionMarketState,
  tick:   number
): EmergenceEvent | null {
  if (market.giniCoeff > 0.25) return null;  // fragmentation = low gini (equal shares)
  const n = market.allocations.length;
  if (n < 4) return null;

  return {
    type:        "attention_fragmentation",
    agentIds:    market.allocations.map((a) => a.agentId),
    description: `attention is fragmented across ${n} agents equally (Gini ${market.giniCoeff.toFixed(3)}) — no dominant signal`,
    strength:    Math.round(Math.max(0, 1 - market.giniCoeff / 0.25) * 1000) / 1000,
    tick,
  };
}

// ─── Main detector ────────────────────────────────────────────────────────────

/**
 * Run all emergence detectors and return a consolidated report.
 */
export function detectEmergence(
  agents:       EconomicAgent[],
  market:       AttentionMarketState,
  conversions:  ConversionOutput[],
  equilibrium:  EquilibriumReport,
  tick:         number
): EmergenceReport {
  void equilibrium; // available for future detection patterns

  const events: EmergenceEvent[] = [
    detectCategoryDominance(agents, market, tick),
    detectConversionCluster(agents, conversions, tick),
    detectCrossNicheMigration(agents, tick),
    detectFitnessCascade(agents, tick),
    detectMonopolyFormation(market, tick),
    detectStrategyConvergence(agents, tick),
    detectAttentionFragmentation(market, tick),
  ].filter((e): e is EmergenceEvent => e !== null);

  const dominant = events.length > 0
    ? events.sort((a, b) => b.strength - a.strength)[0].type
    : null;

  return {
    events:          events.sort((a, b) => b.strength - a.strength),
    alertCount:      events.length,
    dominantPattern: dominant,
  };
}
