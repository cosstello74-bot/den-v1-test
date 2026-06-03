/**
 * v8 Attention Market Simulator.
 *
 * Models user attention as a finite, rivalrous resource:
 *   - Total pool is fixed at 1.0 (normalised)
 *   - Agents compete for share via conversion efficiency and reach
 *   - Higher efficiency attracts proportionally more attention
 *   - Diminishing returns prevent monopoly: α-dampened power allocation
 *   - Minimum floor ensures weak agents are never fully starved
 *
 * Formula (softmax-like with diminishing returns):
 *   raw_i = (efficiency_i ^ α) × reach_i
 *   share_i = raw_i / Σ raw_j   clamped to [FLOOR, CEILING]
 *
 * Pure function — no I/O.
 */

import type { EconomicAgent } from "../agents/economicAgent";
import { SV } from "../agents/economicAgent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttentionAllocation = {
  agentId:           string;
  allocatedAttention: number;   // 0–1 share of total pool
  rawCompetitiveScore: number;  // unnormalised score before distribution
  marginalReturn:    number;    // d(attention)/d(efficiency) — diminishing returns signal
};

export type AttentionMarketState = {
  allocations:    AttentionAllocation[];
  totalPool:      number;       // always 1.0 in normalised model
  giniCoeff:      number;       // 0 = perfect equality, 1 = monopoly
  hhi:            number;       // Herfindahl-Hirschman Index (market concentration)
  dominantAgentId: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALPHA        = 0.65;   // diminishing returns exponent (<1 compresses differences)
const FLOOR        = 0.02;   // minimum attention any agent can hold
const CEILING      = 0.50;   // maximum attention any single agent can hold

// ─── Market mechanics ─────────────────────────────────────────────────────────

/**
 * Compute raw competitive score for one agent.
 * Efficiency dampened by α, scaled by reach dimension.
 */
export function agentCompetitiveScore(agent: EconomicAgent): number {
  const reach = agent.strategyVector[SV.REACH] ?? 0.5;
  return Math.pow(Math.max(0.001, agent.conversionEfficiency), ALPHA) * reach;
}

/**
 * Gini coefficient of an attention allocation.
 * Measures inequality in attention distribution (0 = equal, 1 = one monopolist).
 */
export function computeGini(shares: number[]): number {
  const n     = shares.length;
  if (n === 0) return 0;
  const sorted = [...shares].sort((a, b) => a - b);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += (2 * (i + 1) - n - 1) * sorted[i];
  return Math.round((sum / (n * sorted.reduce((s, x) => s + x, 0))) * 1000) / 1000;
}

/**
 * Herfindahl-Hirschman Index — sum of squared market shares.
 * <0.15 = competitive, 0.15–0.25 = moderate concentration, >0.25 = concentrated.
 */
export function computeHHI(shares: number[]): number {
  return Math.round(shares.reduce((s, x) => s + x * x, 0) * 1000) / 1000;
}

// ─── Main allocation function ─────────────────────────────────────────────────

/**
 * Distribute the attention pool across all agents.
 * Returns a fully specified market state.
 */
export function allocateAttention(agents: EconomicAgent[]): AttentionMarketState {
  if (agents.length === 0) {
    return { allocations: [], totalPool: 1.0, giniCoeff: 0, hhi: 0, dominantAgentId: "" };
  }

  // Step 1 — raw scores
  const rawScores = agents.map((a) => ({ agent: a, score: agentCompetitiveScore(a) }));
  const totalRaw  = rawScores.reduce((s, x) => s + x.score, 0);

  // Step 2 — proportional allocation (pre-clamp)
  const rawShares = rawScores.map(({ agent, score }) => ({
    agentId: agent.agentId,
    rawShare: totalRaw > 0 ? score / totalRaw : 1 / agents.length,
    score,
  }));

  // Step 3 — apply floor/ceiling clamps + redistribute surplus
  let clampedShares = rawShares.map((r) => ({ ...r, share: Math.min(CEILING, Math.max(FLOOR, r.rawShare)) }));

  // Normalise after clamping (shares may not sum to 1 due to floor/ceiling)
  const clampedSum = clampedShares.reduce((s, x) => s + x.share, 0);
  clampedShares    = clampedShares.map((x) => ({ ...x, share: Math.round((x.share / clampedSum) * 10000) / 10000 }));

  // Step 4 — marginal return: d(share)/d(efficiency) per agent
  const allocations: AttentionAllocation[] = clampedShares.map((x) => ({
    agentId:             x.agentId,
    allocatedAttention:  x.share,
    rawCompetitiveScore: Math.round(x.score * 1000) / 1000,
    marginalReturn:      totalRaw > 0
      ? Math.round((ALPHA * Math.pow(Math.max(0.001, x.rawShare), ALPHA - 1) / totalRaw) * 1000) / 1000
      : 0,
  }));

  const shares   = allocations.map((a) => a.allocatedAttention);
  const dominant = [...allocations].sort((a, b) => b.allocatedAttention - a.allocatedAttention)[0];

  return {
    allocations,
    totalPool:       1.0,
    giniCoeff:       computeGini(shares),
    hhi:             computeHHI(shares),
    dominantAgentId: dominant?.agentId ?? "",
  };
}

/**
 * Apply allocated attention back to agents (update attentionShare field).
 * Returns updated agent array — does not mutate.
 */
export function applyAttentionAllocation(
  agents:      EconomicAgent[],
  marketState: AttentionMarketState
): EconomicAgent[] {
  const map = new Map(marketState.allocations.map((a) => [a.agentId, a.allocatedAttention]));
  return agents.map((a) => ({
    ...a,
    attentionShare: map.get(a.agentId) ?? a.attentionShare,
  }));
}
