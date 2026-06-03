/**
 * v6 Business Rule Engine.
 *
 * Stateless rule evaluator. All rules are pure functions.
 * Gates every opportunity, strategy, and expansion decision
 * against a configurable rule set before execution.
 *
 * Rules:
 *   R1 — expand only high-confidence opportunities (> 0.85)
 *   R2 — suppress low ROI categories (avgRevenue < minRevenue)
 *   R3 — prioritise high conversion intents (convRate >= minConvRate)
 *   R4 — maintain relevance weight minimum (globalRelevanceWeight >= 0.30)
 *   R5 — block retried failed expansions (from businessMemory)
 *   R6 — cap max simultaneous expansion actions per cycle
 */

import type { Opportunity }  from "./opportunityDetector";
import type { Strategy }     from "./strategyEngine";
import type { RevenuePattern } from "./businessMemory";
import type { GlobalWeights }  from "./revenueControl";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RuleId =
  | "R1_high_confidence"
  | "R2_low_roi_suppression"
  | "R3_conversion_priority"
  | "R4_relevance_floor"
  | "R5_blocked_expansion"
  | "R6_expansion_cap";

export type RuleViolation = {
  ruleId:   RuleId;
  target:   string;
  reason:   string;
};

export type RuleEvaluationResult<T> = {
  allowed:    T[];
  blocked:    Array<{ item: T; violation: RuleViolation }>;
};

export type BusinessRulesConfig = {
  /** Minimum confidence for expansion opportunities. Default: 0.85 */
  minConfidence:         number;
  /** Minimum avg revenue for a category to avoid suppression. Default: 0.10 */
  minCategoryRevenue:    number;
  /** Minimum conversion rate for intent to be prioritised. Default: 0.03 */
  minConvRate:           number;
  /** Relevance weight must never drop below this. Default: 0.30 */
  minRelevanceWeight:    number;
  /** Max expansion actions per business cycle. Default: 5 */
  maxExpansionsPerCycle: number;
};

export const DEFAULT_RULES_CONFIG: BusinessRulesConfig = {
  minConfidence:         0.85,
  minCategoryRevenue:    0.10,
  minConvRate:           0.03,
  minRelevanceWeight:    0.30,
  maxExpansionsPerCycle: 5,
};

// ─── Rule implementations ─────────────────────────────────────────────────────

/** R1 — Only approve opportunities above confidence threshold. */
export function applyConfidenceGate(
  opportunities: Opportunity[],
  minConfidence: number
): RuleEvaluationResult<Opportunity> {
  const allowed: Opportunity[] = [];
  const blocked: RuleEvaluationResult<Opportunity>["blocked"] = [];

  for (const opp of opportunities) {
    if (opp.confidence >= minConfidence) {
      allowed.push(opp);
    } else {
      blocked.push({
        item:      opp,
        violation: {
          ruleId: "R1_high_confidence",
          target: opp.name,
          reason: `confidence ${opp.confidence.toFixed(2)} < threshold ${minConfidence}`,
        },
      });
    }
  }

  return { allowed, blocked };
}

/** R2 — Suppress strategies targeting known low-ROI categories. */
export function applyLowROISuppression(
  strategies:        Strategy[],
  revenuePatterns:   RevenuePattern[],
  minCategoryRevenue: number
): RuleEvaluationResult<Strategy> {
  const lowROI = new Set(
    revenuePatterns
      .filter((p) => p.avgRevenue < minCategoryRevenue && p.observedCount >= 3)
      .map((p) => p.slug)
  );

  const allowed: Strategy[] = [];
  const blocked: RuleEvaluationResult<Strategy>["blocked"] = [];

  for (const s of strategies) {
    if (lowROI.has(s.target)) {
      blocked.push({
        item:      s,
        violation: {
          ruleId: "R2_low_roi_suppression",
          target: s.target,
          reason: `"${s.target}" has historically low revenue (< $${minCategoryRevenue.toFixed(2)} avg)`,
        },
      });
    } else {
      allowed.push(s);
    }
  }

  return { allowed, blocked };
}

/** R3 — Prioritise strategies toward high-conversion intents (reorder, not block). */
export function applyConversionPriority(
  strategies:   Strategy[],
  minConvRate:  number,
  convRateMap:  Record<string, number>
): Strategy[] {
  return [...strategies].sort((a, b) => {
    const ca = convRateMap[a.target] ?? 0;
    const cb = convRateMap[b.target] ?? 0;
    const aHigh = ca >= minConvRate;
    const bHigh = cb >= minConvRate;
    if (aHigh && !bHigh) return -1;
    if (bHigh && !aHigh) return 1;
    return b.priority - a.priority;
  });
}

/** R4 — Block any global weight adjustment that drops relevance below the floor. */
export function applyRelevanceFloor(
  proposed:           GlobalWeights,
  minRelevanceWeight: number
): { allowed: boolean; violation?: RuleViolation } {
  if (proposed.globalRelevanceWeight < minRelevanceWeight) {
    return {
      allowed: false,
      violation: {
        ruleId: "R4_relevance_floor",
        target: "global_weights",
        reason: `globalRelevanceWeight ${proposed.globalRelevanceWeight.toFixed(2)} would drop below floor ${minRelevanceWeight}`,
      },
    };
  }
  return { allowed: true };
}

/** R5 — Block expansion strategies for slugs currently in the blocked list. */
export function applyBlockedExpansionFilter(
  strategies:    Strategy[],
  blockedSlugs:  string[]
): RuleEvaluationResult<Strategy> {
  const blocked_set = new Set(blockedSlugs);
  const allowed: Strategy[] = [];
  const blocked: RuleEvaluationResult<Strategy>["blocked"] = [];

  for (const s of strategies) {
    if (s.action === "expand_category" && blocked_set.has(s.target)) {
      blocked.push({
        item:      s,
        violation: {
          ruleId: "R5_blocked_expansion",
          target: s.target,
          reason: `"${s.target}" is in the failed expansion cooldown list`,
        },
      });
    } else {
      allowed.push(s);
    }
  }

  return { allowed, blocked };
}

/** R6 — Cap expansion actions to maxExpansionsPerCycle. */
export function applyExpansionCap(
  strategies: Strategy[],
  maxCap:     number
): RuleEvaluationResult<Strategy> {
  const expansions = strategies.filter((s) => s.action === "expand_category");
  const others     = strategies.filter((s) => s.action !== "expand_category");

  const allowedExpansions = expansions.slice(0, maxCap);
  const cappedExpansions  = expansions.slice(maxCap);

  const blocked = cappedExpansions.map((s) => ({
    item:      s,
    violation: {
      ruleId:  "R6_expansion_cap" as RuleId,
      target:  s.target,
      reason:  `expansion cap of ${maxCap} reached for this cycle`,
    },
  }));

  return { allowed: [...allowedExpansions, ...others], blocked };
}

// ─── Full rule pipeline ───────────────────────────────────────────────────────

export type FullRuleResult = {
  approvedStrategies: Strategy[];
  allViolations:      RuleViolation[];
};

/**
 * Run the full business rule pipeline against a set of strategies.
 */
export function runBusinessRules(
  strategies:       Strategy[],
  revenuePatterns:  RevenuePattern[],
  blockedSlugs:     string[],
  convRateMap:      Record<string, number>,
  cfg:              BusinessRulesConfig = DEFAULT_RULES_CONFIG
): FullRuleResult {
  const violations: RuleViolation[] = [];

  // R2 — suppress low ROI
  const r2 = applyLowROISuppression(strategies, revenuePatterns, cfg.minCategoryRevenue);
  violations.push(...r2.blocked.map((b) => b.violation));

  // R5 — blocked expansions
  const r5 = applyBlockedExpansionFilter(r2.allowed, blockedSlugs);
  violations.push(...r5.blocked.map((b) => b.violation));

  // R3 — reorder by conversion priority (non-blocking)
  const r3 = applyConversionPriority(r5.allowed, cfg.minConvRate, convRateMap);

  // R6 — expansion cap
  const r6 = applyExpansionCap(r3, cfg.maxExpansionsPerCycle);
  violations.push(...r6.blocked.map((b) => b.violation));

  return {
    approvedStrategies: r6.allowed,
    allViolations:      violations,
  };
}
