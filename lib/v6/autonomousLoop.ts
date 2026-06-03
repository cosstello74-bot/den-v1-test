/**
 * v6 Autonomous Business Loop Orchestrator.
 *
 * Ties together the full v6 pipeline:
 *
 *   user activity signals
 *     → opportunityDetector   (detect what to act on)
 *     → strategyEngine        (decide what to do)
 *     → businessRules         (gate the decisions)
 *     → marketingEngine       (boost/suppress pages)
 *     → revenueControl        (apply global weight bias)
 *     → businessMemory        (persist learnings)
 *     → return LoopResult     (caller persists, displays, feeds into v4/v5)
 *
 * Designed to run client-side after each significant user interaction
 * (quiz completion, affiliate click, session end).
 * All localStorage access is SSR-guarded inside sub-modules.
 */

import type { Opportunity, TrafficSignal, IntentSignal } from "./opportunityDetector";
import type { Strategy }         from "./strategyEngine";
import type { MarketingDecision } from "./marketingEngine";
import type { RevenueOutcomeSimulation } from "./revenueControl";
import type { FullRuleResult }   from "./businessRules";

import { detectOpportunities }           from "./opportunityDetector";
import { generateStrategies, deduplicateStrategies } from "./strategyEngine";
import { runMarketingEngine }            from "./marketingEngine";
import { simulateRevenueOutcomes, loadRevenueControlState } from "./revenueControl";
import { runBusinessRules, DEFAULT_RULES_CONFIG } from "./businessRules";
import type { BusinessRulesConfig }      from "./businessRules";
import {
  loadMemory,
  recordWinningStrategy,
  recordRevenuePattern,
} from "./businessMemory";
import type { PerformanceStore } from "@/lib/v5/performanceTracker";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AutonomousLoopInput = {
  trafficSignals:   TrafficSignal[];
  intentSignals:    IntentSignal[];
  performanceStore: PerformanceStore;
  /** Baseline simulated revenue for outcome comparison. Default: 1.0 */
  baselineRevenue?: number;
  rulesConfig?:     Partial<BusinessRulesConfig>;
};

export type DecisionLogEntry = {
  timestamp:   number;
  action:      string;
  target:      string;
  reason:      string;
  impact:      number;
};

export type AutonomousLoopResult = {
  opportunities:       Opportunity[];
  rawStrategies:       Strategy[];
  approvedStrategies:  Strategy[];
  ruleResult:          FullRuleResult;
  marketingDecision:   MarketingDecision;
  revenueSimulations:  RevenueOutcomeSimulation[];
  decisionLog:         DecisionLogEntry[];
  cycleTimestamp:      number;
};

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Run one full autonomous business loop cycle.
 * Returns a complete result object for display and downstream use.
 */
export function runAutonomousLoop(input: AutonomousLoopInput): AutonomousLoopResult {
  const baselineRevenue = input.baselineRevenue ?? 1.0;
  const rulesConfig     = { ...DEFAULT_RULES_CONFIG, ...(input.rulesConfig ?? {}) };

  // 1. Detect opportunities
  const opportunities = detectOpportunities({
    trafficSignals:   input.trafficSignals,
    intentSignals:    input.intentSignals,
    performanceStore: input.performanceStore,
  });

  // 2. Generate strategies
  const rawStrategies = deduplicateStrategies(generateStrategies(opportunities));

  // 3. Load memory for rule context
  const memory     = loadMemory();
  const convRateMap: Record<string, number> = {};
  for (const cluster of memory.behaviourClusters) {
    convRateMap[cluster.purposeKey] = cluster.avgConvRate;
  }
  const blockedSlugs = memory.failedExpansions
    .filter((f) => Date.now() < f.retryAfter)
    .map((f) => f.slug);

  // 4. Apply business rules
  const ruleResult = runBusinessRules(
    rawStrategies,
    memory.revenuePatterns,
    blockedSlugs,
    convRateMap,
    rulesConfig
  );

  // 5. Run marketing engine
  const marketingDecision = runMarketingEngine({
    trafficSignals: input.trafficSignals,
    strategies:     ruleResult.approvedStrategies,
  });

  // 6. Simulate revenue outcomes
  const revenueSimulations = simulateRevenueOutcomes(
    ruleResult.approvedStrategies,
    baselineRevenue
  );

  // 7. Build decision log
  const cycleTimestamp = Date.now();
  const decisionLog: DecisionLogEntry[] = ruleResult.approvedStrategies.map((s) => ({
    timestamp: cycleTimestamp,
    action:    s.action,
    target:    s.target,
    reason:    s.reason,
    impact:    s.expectedRevenueImpact,
  }));

  // 8. Persist learnings — record winning strategies to memory
  const controlState = loadRevenueControlState();
  void controlState; // available for future use

  for (const sim of revenueSimulations.slice(0, 3)) {
    if (sim.relativeImpact > 0) {
      recordWinningStrategy(sim.strategy.action, sim.strategy.target, sim.relativeImpact);
    }
  }

  // Record page revenue patterns for boosted pages
  for (const boost of marketingDecision.boostedPages) {
    const trafficMatch = input.trafficSignals.find((t) => t.slug === boost.slug);
    if (trafficMatch) {
      const simRev = trafficMatch.affiliateClicks * 0.04 * trafficMatch.conversionRate * 100;
      recordRevenuePattern(boost.slug, simRev, "unknown");
    }
  }

  return {
    opportunities,
    rawStrategies,
    approvedStrategies: ruleResult.approvedStrategies,
    ruleResult,
    marketingDecision,
    revenueSimulations,
    decisionLog,
    cycleTimestamp,
  };
}

// ─── Decision log persistence ─────────────────────────────────────────────────

const DECISION_LOG_KEY = "den_v6_decision_log";
const MAX_LOG_ENTRIES  = 100;

export function appendDecisionLog(entries: DecisionLogEntry[]): void {
  if (typeof window === "undefined" || entries.length === 0) return;
  try {
    const raw      = localStorage.getItem(DECISION_LOG_KEY);
    const existing = raw ? (JSON.parse(raw) as DecisionLogEntry[]) : [];
    const merged   = [...entries, ...existing].slice(0, MAX_LOG_ENTRIES);
    localStorage.setItem(DECISION_LOG_KEY, JSON.stringify(merged));
  } catch {
    // quota exceeded — silent fail
  }
}

export function loadDecisionLog(): DecisionLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DECISION_LOG_KEY);
    return raw ? (JSON.parse(raw) as DecisionLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearDecisionLog(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(DECISION_LOG_KEY); } catch { /* ignore */ }
}
