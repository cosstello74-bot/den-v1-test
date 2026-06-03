/**
 * v8 Strategy Evolution Field.
 *
 * Strategies are 5-dimensional vectors in a continuous field.
 * Each tick:
 *   1. Successful agents (positive fitness trend) attract neighbours
 *   2. Failed agents drift toward field mean (regression)
 *   3. All agents undergo small random mutation (Gaussian noise)
 *   4. Vector components clamped to [0, 1]
 *
 * This produces emergent strategy clustering without explicit rules.
 * Pure function — no I/O.
 */

import type { EconomicAgent } from "../agents/economicAgent";
import { computeAgentFitness, fitnessTrend, meanFitness } from "../agents/economicAgent";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MutationRecord = {
  agentId:      string;
  dimension:    number;    // which SV dimension changed most
  delta:        number;    // signed change magnitude
  mutationType: "drift" | "attraction" | "noise";
};

export type FieldTickResult = {
  updatedAgents:    EconomicAgent[];
  mutations:        MutationRecord[];
  fieldMeanVector:  number[];
  mutationRate:     number;    // fraction of agents that mutated meaningfully
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VECTOR_DIMS     = 5;
const NOISE_SIGMA     = 0.03;   // Gaussian noise standard deviation per dimension
const ATTRACTION_RATE = 0.08;   // how fast weak agents move toward strong ones
const DRIFT_RATE      = 0.05;   // how fast failed agents drift toward field mean
const MUTATION_THRESHOLD = 0.01; // minimum delta to count as "meaningful mutation"

// ─── Pseudo-random Gaussian noise ─────────────────────────────────────────────

/**
 * Box-Muller transform — produces Gaussian noise from uniform random.
 * Seeded by tick + agentId hash for reproducibility within a tick.
 */
function gaussianNoise(sigma: number, seed: number): number {
  // LCG pseudo-random seeded by input
  const a = 1664525, c = 1013904223, m = 2 ** 32;
  const r1 = ((seed * a + c) % m) / m;
  const r2 = (((seed * a + c + a) * a + c) % m) / m;
  const u1 = Math.max(1e-10, r1);
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * r2);
}

function agentSeed(agentId: string, tick: number, dim: number): number {
  let h = tick * 31 + dim * 97;
  for (let i = 0; i < agentId.length; i++) h = (h * 31 + agentId.charCodeAt(i)) >>> 0;
  return h;
}

// ─── Field computations ───────────────────────────────────────────────────────

/**
 * Compute the mean strategy vector across all agents (field centroid).
 */
export function computeFieldMean(agents: EconomicAgent[]): number[] {
  if (agents.length === 0) return new Array(VECTOR_DIMS).fill(0.5);
  const sum = new Array(VECTOR_DIMS).fill(0);
  for (const a of agents) {
    for (let d = 0; d < VECTOR_DIMS; d++) sum[d] += a.strategyVector[d] ?? 0.5;
  }
  return sum.map((v) => Math.round((v / agents.length) * 1000) / 1000);
}

/**
 * Find the highest-fitness agent to use as an attractor.
 */
function findAttractor(agents: EconomicAgent[]): EconomicAgent | null {
  if (agents.length === 0) return null;
  return agents.reduce((best, a) =>
    computeAgentFitness(a) > computeAgentFitness(best) ? a : best
  );
}

// ─── Mutation functions ───────────────────────────────────────────────────────

/**
 * Apply noise mutation to a single strategy vector.
 */
function applyNoise(vector: number[], agentId: string, tick: number): { vector: number[]; deltas: number[] } {
  const deltas = new Array(VECTOR_DIMS).fill(0);
  const result = vector.map((v, d) => {
    const noise = gaussianNoise(NOISE_SIGMA, agentSeed(agentId, tick, d));
    deltas[d]   = noise;
    return Math.max(0, Math.min(1, v + noise));
  });
  return { vector: result, deltas };
}

/**
 * Move a vector toward a target at rate `rate`.
 */
function moveToward(from: number[], to: number[], rate: number): { vector: number[]; deltas: number[] } {
  const deltas = new Array(VECTOR_DIMS).fill(0);
  const result = from.map((v, d) => {
    const delta = (to[d] - v) * rate;
    deltas[d]   = delta;
    return Math.max(0, Math.min(1, v + delta));
  });
  return { vector: result, deltas };
}

// ─── Main tick ────────────────────────────────────────────────────────────────

/**
 * Evolve all agent strategies by one tick.
 *
 * Rules:
 *   - Agents with IMPROVING fitness trend → attract toward top performer
 *   - Agents with DECLINING fitness trend → drift toward field mean
 *   - All agents → small Gaussian noise mutation
 */
export function evolveStrategies(agents: EconomicAgent[], tick: number): FieldTickResult {
  const fieldMean  = computeFieldMean(agents);
  const attractor  = findAttractor(agents);
  const mutations:  MutationRecord[] = [];

  const updatedAgents: EconomicAgent[] = agents.map((agent) => {
    const trend = fitnessTrend(agent);
    let vector  = [...agent.strategyVector];
    let primaryDelta = 0;
    let mutationType: MutationRecord["mutationType"] = "noise";

    // 1. Attraction / drift
    if (trend === 1 && attractor && attractor.agentId !== agent.agentId) {
      const { vector: v, deltas } = moveToward(vector, attractor.strategyVector, ATTRACTION_RATE);
      vector = v;
      primaryDelta  = Math.max(...deltas.map(Math.abs));
      mutationType  = "attraction";
    } else if (trend === -1) {
      const { vector: v, deltas } = moveToward(vector, fieldMean, DRIFT_RATE);
      vector = v;
      primaryDelta  = Math.max(...deltas.map(Math.abs));
      mutationType  = "drift";
    }

    // 2. Gaussian noise (always applied)
    const { vector: noisy, deltas: noiseDeltas } = applyNoise(vector, agent.agentId, tick);
    vector = noisy;

    const noiseDelta = Math.max(...noiseDeltas.map(Math.abs));
    const totalDelta = Math.max(primaryDelta, noiseDelta);

    if (totalDelta >= MUTATION_THRESHOLD) {
      mutations.push({
        agentId:      agent.agentId,
        dimension:    noiseDeltas.indexOf(Math.max(...noiseDeltas.map(Math.abs))),
        delta:        Math.round(totalDelta * 1000) / 1000,
        mutationType,
      });
    }

    // 3. Update resourceAllocationBias from revenue vs relevance dims
    const newBias = Math.round((vector[1] - vector[0]) * 100) / 100;

    return {
      ...agent,
      strategyVector:         vector,
      resourceAllocationBias: Math.max(-1, Math.min(1, newBias)),
      lastMutatedAt:          totalDelta >= MUTATION_THRESHOLD ? tick : agent.lastMutatedAt,
      age:                    agent.age + 1,
    };
  });

  const mutationRate = Math.round((mutations.length / Math.max(agents.length, 1)) * 1000) / 1000;

  return { updatedAgents, mutations, fieldMeanVector: fieldMean, mutationRate };
}

/**
 * Compute strategy diversity across the field.
 * Returns mean pairwise Euclidean distance between all agent vectors.
 */
export function computeStrategyDiversity(agents: EconomicAgent[]): number {
  if (agents.length < 2) return 0;
  let totalDist = 0;
  let pairs     = 0;
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const a = agents[i].strategyVector;
      const b = agents[j].strategyVector;
      const dist = Math.sqrt(a.reduce((s, v, d) => s + Math.pow(v - (b[d] ?? 0.5), 2), 0));
      totalDist += dist;
      pairs++;
    }
  }
  return Math.round((totalDist / pairs) * 1000) / 1000;
}
