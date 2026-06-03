/**
 * v7 Eco Evolution Engine.
 *
 * Drives the full evolution cycle of the ecosystem:
 *   1. Simulate current node performance (deploymentSimulator)
 *   2. Run global selection (globalSelection)
 *   3. Propagate top strategies (strategyTransfer)
 *   4. Generate candidate replacement nodes (nodeGenerator)
 *   5. Publish learnings to intelligence network
 *   6. Persist updated ecosystem state
 *
 * This is the top-level v7 orchestration entry point.
 * Call once per "evolution tick" (quiz completion, session end, or manual trigger).
 *
 * localStorage: delegates to ecosystemOrchestrator, intelligenceNetwork.
 * SSR-safe.
 */

import type { Opportunity }       from "@/lib/v6/opportunityDetector";
import type { RevenuePattern }    from "@/lib/v6/businessMemory";

import {
  loadEcosystem,
  saveEcosystem,
  addNode,
  rankNodes,
  incrementCycle,
  getActiveNodes,
  type EcosystemState,
} from "./ecosystemOrchestrator";
import { simulateEcosystem, applySimulationToNodes } from "./deploymentSimulator";
import { runGlobalSelection, getTopNodeIds }         from "./globalSelection";
import { propagateTopStrategy }                       from "./strategyTransfer";
import { generateCandidateNodes }                    from "./nodeGenerator";
import {
  publishIntent,
  publishRevenueCategory,
  seedPageFormats,
} from "./intelligenceNetwork";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EvolutionTickResult = {
  cycleNumber:         number;
  nodesSimulated:      number;
  nodesAfterSelection: number;
  nodesAdded:          number;
  transfersExecuted:   number;
  dominantNiche:       string;
  totalSimRevenue:     number;
  propagationRate:     number;
  ecosystemState:      EcosystemState;
};

export type EvolutionConfig = {
  /** Max new nodes to generate per tick. Default: 2 */
  maxNewNodesPerTick: number;
  /** Strategy transfer rate. Default: 0.30 */
  transferRate:       number;
  /** Min fitness threshold for top-node replication. Default: 0.10 */
  minFitnessToReplicate: number;
};

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  maxNewNodesPerTick:    2,
  transferRate:          0.30,
  minFitnessToReplicate: 0.10,
};

// ─── Main evolution tick ──────────────────────────────────────────────────────

/**
 * Run one full evolution tick.
 * Returns a summary result and the updated EcosystemState (already persisted).
 */
export function runEvolutionTick(
  opportunities:   Opportunity[]   = [],
  revenuePatterns: RevenuePattern[] = [],
  cfg:             EvolutionConfig = DEFAULT_EVOLUTION_CONFIG
): EvolutionTickResult {
  let state = loadEcosystem();

  // Step 1 — simulate deployments
  const snapshot = simulateEcosystem(state.nodes);

  // Step 2 — apply simulation back to nodes (update revenueScore, conversionRate)
  const nodesAfterSim = applySimulationToNodes(state.nodes, snapshot);
  state = { ...state, nodes: nodesAfterSim, totalRevenue: snapshot.totalRevenue };

  // Step 3 — global selection (status + traffic redistribution)
  const selectionOutcome = runGlobalSelection(state.nodes, snapshot);
  state = { ...state, nodes: selectionOutcome.updatedNodes };

  // Step 4 — strategy propagation
  const { results: transfers, updatedNodes: nodesAfterTransfer } = propagateTopStrategy(
    state.nodes,
    cfg.transferRate
  );
  state = { ...state, nodes: nodesAfterTransfer };

  // Step 5 — node generation (only if top nodes exceed fitness threshold)
  const topIds = getTopNodeIds(state.nodes, snapshot, 3);
  const topNodes = topIds.map((id) => state.nodes.find((n) => n.nodeId === id)!).filter(Boolean);
  const existingNiches = state.nodes.map((n) => n.niche);
  const generation = Math.max(0, ...state.nodes.map((n) => n.generation)) + 1;

  const shouldReplicate = topNodes.some((n) => n.conversionRate >= cfg.minFitnessToReplicate);
  const newNodes = shouldReplicate
    ? generateCandidateNodes(opportunities, revenuePatterns, topNodes, existingNiches, generation, cfg.maxNewNodesPerTick)
    : [];

  let addedCount = 0;
  for (const node of newNodes) {
    const prev = state.nodes.length;
    state = addNode(state, node);
    if (state.nodes.length > prev) addedCount++;
  }

  // Step 6 — publish learnings to intelligence network
  seedPageFormats("ecosystem_orchestrator");
  for (const node of getActiveNodes(state)) {
    if (node.conversionRate > 0) {
      publishIntent("ecosystem_orchestrator", node.niche, node.conversionRate, Math.round(node.trafficShare * 100), node.conversionRate);
      publishRevenueCategory("ecosystem_orchestrator", node.niche, node.revenueScore, 1);
    }
  }

  // Step 7 — increment cycle counter and persist
  state = incrementCycle(state);
  saveEcosystem(state);

  // Compute dominant niche
  const ranked = rankNodes(getActiveNodes(state));
  const dominantNiche = ranked[0]?.niche ?? "unknown";

  return {
    cycleNumber:         state.cycleCount,
    nodesSimulated:      snapshot.deployments.length,
    nodesAfterSelection: selectionOutcome.results.length,
    nodesAdded:          addedCount,
    transfersExecuted:   transfers.length,
    dominantNiche,
    totalSimRevenue:     snapshot.totalRevenue,
    propagationRate:     selectionOutcome.propagationRate,
    ecosystemState:      state,
  };
}

// ─── Snapshot helpers ─────────────────────────────────────────────────────────

/**
 * Get a read-only view of current ecosystem state for dashboard display.
 * Runs simulation but does NOT persist.
 */
export function getEcosystemSnapshot(): {
  state:    EcosystemState;
  snapshot: ReturnType<typeof simulateEcosystem>;
  ranked:   ReturnType<typeof rankNodes>;
} {
  const state    = loadEcosystem();
  const snapshot = simulateEcosystem(state.nodes);
  const ranked   = rankNodes(state.nodes);
  return { state, snapshot, ranked };
}
