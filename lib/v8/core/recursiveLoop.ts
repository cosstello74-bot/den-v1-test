/**
 * v8 Recursive Market Loop Controller.
 *
 * Executes one full economic tick:
 *
 *   1. Agent competition → attention redistribution (attentionMarket)
 *   2. Conversion recalculation (conversionPhysics)
 *   3. Fitness recording + update
 *   4. Strategy mutation (strategyField)
 *   5. Market equilibrium detection (marketEquilibrium)
 *   6. Emergence detection (emergenceDetector)
 *   7. Persist agent store
 *   8. Return full tick result
 *
 * The loop is designed to run client-side after each user interaction
 * or on demand from the admin dashboard.
 *
 * localStorage: delegates to agentStore.
 * SSR-safe.
 */

import type { EconomicAgent }        from "../agents/economicAgent";
import type { AttentionMarketState } from "../markets/attentionMarket";
import type { ConversionOutput }     from "../physics/conversionPhysics";
import type { FieldTickResult }      from "../evolution/strategyField";
import type { EquilibriumReport }    from "../equilibrium/marketEquilibrium";
import type { EmergenceReport }      from "../intelligence/emergenceDetector";

import {
  loadAgentStore,
  saveAgentStore,
  computeAgentFitness,
  recordFitness,
  bootstrapAgents,
} from "../agents/economicAgent";
import { allocateAttention, applyAttentionAllocation } from "../markets/attentionMarket";
import { computeEconomyConversions, applyConversions } from "../physics/conversionPhysics";
import { evolveStrategies }                            from "../evolution/strategyField";
import { analyseEquilibrium }                          from "../equilibrium/marketEquilibrium";
import { detectEmergence }                             from "../intelligence/emergenceDetector";
import { loadEcosystem }                               from "@/lib/v7/ecosystemOrchestrator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EconomicTickResult = {
  tick:              number;
  agents:            EconomicAgent[];
  attentionMarket:   AttentionMarketState;
  conversions:       ConversionOutput[];
  fieldResult:       FieldTickResult;
  equilibrium:       EquilibriumReport;
  emergence:         EmergenceReport;
  totalConversion:   number;   // sum of all agent finalConversion
  meanFitness:       number;
};

export type LoopConfig = {
  /** Intent signal override per agent (agentId → 0–1). Default: 0.5 for all. */
  intentSignals?: Record<string, number>;
  /** Maximum ticks to run in a single call (guard against infinite loops). Default: 1 */
  maxTicks?:      number;
};

// ─── Main loop tick ───────────────────────────────────────────────────────────

/**
 * Execute one economic tick.
 * Bootstraps agents from v7 ecosystem nodes if store is empty.
 */
export function runEconomicTick(cfg: LoopConfig = {}): EconomicTickResult {
  // Bootstrap from v7 if needed
  const ecosystem    = loadEcosystem();
  let   store        = bootstrapAgents(ecosystem.nodes);
  const tick         = store.tickCount + 1;
  let   agents: EconomicAgent[] = store.agents;

  const intentSignals = cfg.intentSignals ?? {};

  // Step 1 — Attention redistribution
  const attentionMarket = allocateAttention(agents);
  agents = applyAttentionAllocation(agents, attentionMarket);

  // Step 2 — Conversion recalculation
  const conversions = computeEconomyConversions(agents, intentSignals);
  agents = applyConversions(agents, conversions);

  // Step 3 — Record fitness
  agents = agents.map((a) => recordFitness(a, computeAgentFitness(a)));

  // Step 4 — Strategy mutation
  const fieldResult = evolveStrategies(agents, tick);
  agents = fieldResult.updatedAgents;

  // Step 5 — Equilibrium analysis
  const equilibrium = analyseEquilibrium(agents, attentionMarket, fieldResult);

  // Step 6 — Emergence detection
  const emergence = detectEmergence(agents, attentionMarket, conversions, equilibrium, tick);

  // Step 7 — Persist
  const updatedStore = { agents, tickCount: tick, lastUpdated: Date.now() };
  saveAgentStore(updatedStore);

  // Step 8 — Aggregate metrics
  const totalConversion = Math.round(conversions.reduce((s, c) => s + c.finalConversion, 0) * 10000) / 10000;
  const meanFitnessVal  = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + computeAgentFitness(a), 0) / agents.length * 1000) / 1000
    : 0;

  return {
    tick,
    agents,
    attentionMarket,
    conversions,
    fieldResult,
    equilibrium,
    emergence,
    totalConversion,
    meanFitness: meanFitnessVal,
  };
}

/**
 * Get a read-only snapshot of the current economic state without running a tick.
 * Safe to call for dashboard display.
 */
export function getEconomicSnapshot(): Omit<EconomicTickResult, "tick"> & { tick: number } {
  const ecosystem = loadEcosystem();
  const store     = bootstrapAgents(ecosystem.nodes);
  const agents    = store.agents;

  const attentionMarket = allocateAttention(agents);
  const conversions     = computeEconomyConversions(agents, {});
  const fieldResult     = evolveStrategies(agents, store.tickCount);
  const equilibrium     = analyseEquilibrium(agents, attentionMarket, fieldResult);
  const emergence       = detectEmergence(agents, attentionMarket, conversions, equilibrium, store.tickCount);

  const totalConversion = Math.round(conversions.reduce((s, c) => s + c.finalConversion, 0) * 10000) / 10000;
  const meanFitnessVal  = agents.length > 0
    ? Math.round(agents.reduce((s, a) => s + computeAgentFitness(a), 0) / agents.length * 1000) / 1000
    : 0;

  return {
    tick: store.tickCount,
    agents,
    attentionMarket,
    conversions,
    fieldResult,
    equilibrium,
    emergence,
    totalConversion,
    meanFitness: meanFitnessVal,
  };
}
