/**
 * v8 Economic Agent Model.
 *
 * Each DEN node is an economic agent with:
 *   - attentionShare:          fraction of total market attention (0–1)
 *   - conversionEfficiency:    ratio of conversions to attention received (0–1)
 *   - resourceAllocationBias: how aggressively it pursues revenue vs relevance (−1 to +1)
 *   - strategyVector:         5-dimensional float array encoding strategy position in field
 *
 * Agent state is fully serialisable. No methods — pure data + functions.
 * localStorage key: den_v8_agents
 * SSR-safe.
 */

import type { DenNode } from "@/lib/v7/ecosystemOrchestrator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EconomicAgent = {
  agentId:                string;
  niche:                  string;
  attentionShare:         number;    // 0–1, fraction of total attention pool
  conversionEfficiency:   number;    // 0–1
  resourceAllocationBias: number;    // −1 (relevance) to +1 (revenue)
  strategyVector:         number[];  // 5 dims: [relevance, revenue, trust, friction, reach]
  fitnessHistory:         number[];  // last N fitness scores (sliding window)
  age:                    number;    // ticks alive
  lastMutatedAt:          number;    // tick count of last strategy mutation
};

export type AgentStore = {
  agents:      EconomicAgent[];
  tickCount:   number;
  lastUpdated: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY           = "den_v8_agents";
const FITNESS_HISTORY_LEN   = 10;

/** Strategy vector dimension indices. */
export const SV = {
  RELEVANCE: 0,
  REVENUE:   1,
  TRUST:     2,
  FRICTION:  3,
  REACH:     4,
} as const;

// ─── Agent construction ───────────────────────────────────────────────────────

/** Default strategy vector — neutral market position. */
const DEFAULT_VECTOR: number[] = [0.5, 0.5, 0.5, 0.3, 0.5];

/**
 * Derive a starting strategy vector from a DEN node's base strategy name.
 */
export function strategyNameToVector(strategy: string): number[] {
  switch (strategy) {
    case "revenue_optimised":   return [0.30, 0.80, 0.50, 0.20, 0.60];
    case "relevance_first":     return [0.80, 0.30, 0.70, 0.25, 0.50];
    case "hybrid_balanced":     return [0.55, 0.55, 0.60, 0.30, 0.55];
    case "engagement_weighted": return [0.60, 0.45, 0.65, 0.20, 0.70];
    default:                    return [...DEFAULT_VECTOR];
  }
}

/**
 * Create an EconomicAgent from a v7 DenNode.
 */
export function agentFromNode(node: DenNode): EconomicAgent {
  const bias = node.baseStrategy.includes("revenue") ? 0.5
    : node.baseStrategy.includes("relevance") ? -0.5
    : 0.0;

  return {
    agentId:                node.nodeId,
    niche:                  node.niche,
    attentionShare:         node.trafficShare,
    conversionEfficiency:   Math.min(1, node.conversionRate / 0.10),
    resourceAllocationBias: bias,
    strategyVector:         strategyNameToVector(node.baseStrategy),
    fitnessHistory:         [],
    age:                    0,
    lastMutatedAt:          0,
  };
}

// ─── Agent fitness ────────────────────────────────────────────────────────────

/**
 * Compute current fitness from strategy vector and conversion efficiency.
 * fitness = (revenue_dim × efficiency) × (1 − friction_dim) × reach_dim
 */
export function computeAgentFitness(agent: EconomicAgent): number {
  const v = agent.strategyVector;
  const revenue   = v[SV.REVENUE]   ?? 0.5;
  const friction  = v[SV.FRICTION]  ?? 0.3;
  const reach     = v[SV.REACH]     ?? 0.5;
  const trust     = v[SV.TRUST]     ?? 0.5;
  return Math.round(
    revenue * agent.conversionEfficiency * (1 - friction) * reach * trust * 1000
  ) / 1000;
}

/**
 * Update the fitness history sliding window.
 */
export function recordFitness(agent: EconomicAgent, fitness: number): EconomicAgent {
  const history = [...agent.fitnessHistory, fitness].slice(-FITNESS_HISTORY_LEN);
  return { ...agent, fitnessHistory: history };
}

/**
 * Return mean fitness over history window.
 */
export function meanFitness(agent: EconomicAgent): number {
  if (agent.fitnessHistory.length === 0) return 0;
  return agent.fitnessHistory.reduce((s, v) => s + v, 0) / agent.fitnessHistory.length;
}

/**
 * Return fitness trend: +1 improving, −1 declining, 0 stable.
 */
export function fitnessTrend(agent: EconomicAgent): 1 | -1 | 0 {
  const h = agent.fitnessHistory;
  if (h.length < 3) return 0;
  const recent = h.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const older  = h.slice(0, -3).reduce((s, v) => s + v, 0) / Math.max(h.length - 3, 1);
  if (recent > older * 1.05) return 1;
  if (recent < older * 0.95) return -1;
  return 0;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function emptyStore(): AgentStore {
  return { agents: [], tickCount: 0, lastUpdated: 0 };
}

export function loadAgentStore(): AgentStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    return { ...emptyStore(), ...(JSON.parse(raw) as AgentStore) };
  } catch {
    return emptyStore();
  }
}

export function saveAgentStore(store: AgentStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...store, lastUpdated: Date.now() }));
  } catch { /* quota — silent */ }
}

export function clearAgentStore(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

/**
 * Initialise agents from v7 nodes if store is empty.
 */
export function bootstrapAgents(nodes: DenNode[]): AgentStore {
  const store = loadAgentStore();
  if (store.agents.length > 0) return store;
  const agents = nodes.map(agentFromNode);
  const initialised: AgentStore = { agents, tickCount: 0, lastUpdated: Date.now() };
  saveAgentStore(initialised);
  return initialised;
}
