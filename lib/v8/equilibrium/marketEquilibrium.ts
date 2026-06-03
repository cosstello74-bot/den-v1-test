/**
 * v8 Market Equilibrium Engine.
 *
 * Detects stable and unstable market states from agent and market data.
 *
 * Stability definitions:
 *   STABLE:   low variance in fitness history, low mutation rate, low HHI
 *   UNSTABLE: high fitness variance, rapid mutation, attention monopoly forming
 *   SHIFTING: agents crossing fitness trajectory boundaries (trend reversals)
 *
 * Pure function — no I/O.
 */

import type { EconomicAgent }     from "../agents/economicAgent";
import type { AttentionMarketState } from "../markets/attentionMarket";
import type { FieldTickResult }   from "../evolution/strategyField";
import { computeAgentFitness, fitnessTrend, meanFitness } from "../agents/economicAgent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EquilibriumState = "stable" | "unstable" | "shifting" | "chaotic";

export type ClusterType = "dominant" | "competing" | "isolated";

export type MarketCluster = {
  clusterIds:   string[];   // agent ids in this cluster
  clusterType:  ClusterType;
  meanFitness:  number;
  attentionShare: number;
};

export type EquilibriumReport = {
  state:            EquilibriumState;
  stableClusters:   string[];          // agent ids in stable high-fitness group
  unstableNodes:    string[];          // agent ids with high instability
  shiftingTrends:   string[];          // agent ids with fitness trend reversals
  clusters:         MarketCluster[];
  stabilityScore:   number;            // 0–1 (1 = perfectly stable)
  hhi:              number;            // attention concentration
  diversityScore:   number;            // strategy diversity
  summary:          string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STABLE_HHI_MAX       = 0.20;   // HHI below this = competitive
const UNSTABLE_MUTATION_MIN = 0.50;   // >50% agents mutating = unstable
const FITNESS_VAR_THRESHOLD = 0.02;   // variance above this = unstable agent

// ─── Variance helper ──────────────────────────────────────────────────────────

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
}

// ─── Clustering ───────────────────────────────────────────────────────────────

/**
 * Simple fitness-based clustering: group agents into top/mid/bottom tiers.
 */
function clusterAgents(agents: EconomicAgent[], marketState: AttentionMarketState): MarketCluster[] {
  if (agents.length === 0) return [];

  const alloc  = new Map(marketState.allocations.map((a) => [a.agentId, a.allocatedAttention]));
  const scored = agents
    .map((a) => ({ agent: a, fitness: computeAgentFitness(a) }))
    .sort((a, b) => b.fitness - a.fitness);

  const n      = scored.length;
  const topCut = Math.ceil(n * 0.25);
  const botCut = Math.ceil(n * 0.25);

  const clusters: MarketCluster[] = [];

  const topGroup = scored.slice(0, topCut);
  if (topGroup.length > 0) {
    clusters.push({
      clusterIds:    topGroup.map((x) => x.agent.agentId),
      clusterType:   "dominant",
      meanFitness:   Math.round(topGroup.reduce((s, x) => s + x.fitness, 0) / topGroup.length * 1000) / 1000,
      attentionShare: Math.round(topGroup.reduce((s, x) => s + (alloc.get(x.agent.agentId) ?? 0), 0) * 100) / 100,
    });
  }

  const midGroup = scored.slice(topCut, n - botCut);
  if (midGroup.length > 0) {
    clusters.push({
      clusterIds:    midGroup.map((x) => x.agent.agentId),
      clusterType:   "competing",
      meanFitness:   Math.round(midGroup.reduce((s, x) => s + x.fitness, 0) / midGroup.length * 1000) / 1000,
      attentionShare: Math.round(midGroup.reduce((s, x) => s + (alloc.get(x.agent.agentId) ?? 0), 0) * 100) / 100,
    });
  }

  const botGroup = scored.slice(n - botCut);
  if (botGroup.length > 0) {
    clusters.push({
      clusterIds:    botGroup.map((x) => x.agent.agentId),
      clusterType:   "isolated",
      meanFitness:   Math.round(botGroup.reduce((s, x) => s + x.fitness, 0) / botGroup.length * 1000) / 1000,
      attentionShare: Math.round(botGroup.reduce((s, x) => s + (alloc.get(x.agent.agentId) ?? 0), 0) * 100) / 100,
    });
  }

  return clusters;
}

// ─── Main equilibrium function ────────────────────────────────────────────────

/**
 * Analyse market state and return an equilibrium report.
 */
export function analyseEquilibrium(
  agents:       EconomicAgent[],
  marketState:  AttentionMarketState,
  fieldResult:  FieldTickResult
): EquilibriumReport {
  const stableClusters:  string[] = [];
  const unstableNodes:   string[] = [];
  const shiftingTrends:  string[] = [];

  for (const agent of agents) {
    const fVar   = variance(agent.fitnessHistory);
    const trend  = fitnessTrend(agent);
    const mFit   = meanFitness(agent);

    // Stable = low variance + positive or flat trend + non-trivial fitness
    if (fVar < FITNESS_VAR_THRESHOLD && mFit > 0.01 && trend >= 0) {
      stableClusters.push(agent.agentId);
    }

    // Unstable = high variance
    if (fVar >= FITNESS_VAR_THRESHOLD) {
      unstableNodes.push(agent.agentId);
    }

    // Shifting = trend reversal (fitness history shows sign change)
    const h = agent.fitnessHistory;
    if (h.length >= 4) {
      const firstHalf  = h.slice(0, Math.floor(h.length / 2));
      const secondHalf = h.slice(Math.floor(h.length / 2));
      const fhMean = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
      const shMean = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
      if (Math.abs(shMean - fhMean) > 0.015) shiftingTrends.push(agent.agentId);
    }
  }

  // Determine overall equilibrium state
  const highConcentration = marketState.hhi > STABLE_HHI_MAX;
  const highMutation      = fieldResult.mutationRate > UNSTABLE_MUTATION_MIN;
  const manyUnstable      = unstableNodes.length > agents.length * 0.4;

  let state: EquilibriumState;
  if (highConcentration && highMutation) {
    state = "chaotic";
  } else if (highMutation || manyUnstable) {
    state = "unstable";
  } else if (shiftingTrends.length > agents.length * 0.3) {
    state = "shifting";
  } else {
    state = "stable";
  }

  // Stability score: inverse of instability signals
  const stabilityScore = Math.round(
    (1 - (unstableNodes.length / Math.max(agents.length, 1)) * 0.5
       - marketState.hhi * 0.3
       - fieldResult.mutationRate * 0.2) * 1000
  ) / 1000;

  const clusters = clusterAgents(agents, marketState);

  const stateDescriptions: Record<EquilibriumState, string> = {
    stable:   "market is converging — dominant strategies emerging",
    unstable: "high turbulence — strategies diverging, attention fragmenting",
    shifting: "market transition — fitness trajectories reversing",
    chaotic:  "monopoly pressure with high mutation — system at bifurcation point",
  };

  return {
    state,
    stableClusters,
    unstableNodes,
    shiftingTrends,
    clusters,
    stabilityScore:  Math.max(0, stabilityScore),
    hhi:             marketState.hhi,
    diversityScore:  fieldResult.mutationRate,
    summary:         stateDescriptions[state],
  };
}
