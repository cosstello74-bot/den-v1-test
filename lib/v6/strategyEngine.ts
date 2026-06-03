/**
 * v6 Autonomous Strategy Engine.
 *
 * Converts detected opportunities into ranked, executable strategies.
 * Each strategy has a single action, a target, and a projected revenue impact.
 *
 * Pure function — no I/O, no localStorage.
 */

import type { Opportunity, OpportunityType } from "./opportunityDetector";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StrategyAction =
  | "expand_category"          // generate new pages for a category cluster
  | "boost_landing_page"       // raise internal link weight for a page
  | "suppress_intent"          // remove low ROI intent from AEL expansion
  | "adjust_revenue_bias"      // shift global revenue weight upward
  | "adjust_relevance_bias"    // shift global relevance weight upward
  | "prioritise_variant"       // lock ranking to the dominant variant
  | "rerank_products";         // force re-ranking for a specific category

export type Strategy = {
  action:                StrategyAction;
  target:                string;        // page slug, category name, or variant id
  priority:              number;        // 0–1
  expectedRevenueImpact: number;        // fractional delta (e.g. 0.22 = +22%)
  reason:                string;
  sourceOpportunity:     OpportunityType;
};

// ─── Revenue impact model ─────────────────────────────────────────────────────

/**
 * Conservative revenue impact estimate per action type.
 * Scaled by opportunity urgency at runtime.
 */
const BASE_IMPACT: Record<StrategyAction, number> = {
  expand_category:       0.25,
  boost_landing_page:    0.12,
  suppress_intent:       0.04,
  adjust_revenue_bias:   0.18,
  adjust_relevance_bias: 0.10,
  prioritise_variant:    0.20,
  rerank_products:       0.08,
};

// ─── Opportunity → strategy mapping ──────────────────────────────────────────

function opportunityToStrategy(opp: Opportunity): Strategy {
  let action:  StrategyAction;
  let target:  string;
  let reason:  string;

  switch (opp.type) {
    case "intent_gap":
      action = "expand_category";
      target = (opp.meta?.["slug"] as string | undefined) ?? opp.name.replace(/\s+/g, "-");
      reason = `intent gap detected — "${opp.name}" has demand but no page`;
      break;

    case "revenue_inefficiency":
      action = "boost_landing_page";
      target = (opp.meta?.["slug"] as string | undefined) ?? opp.name.replace(/\s+/g, "-");
      reason = `"${opp.name}" has traffic but low affiliate CTR — boost internal link weight`;
      break;

    case "conversion_gap":
      action = "rerank_products";
      target = opp.name.replace(/\s+/g, "-");
      reason = `conversion underperformance on "${opp.name}" — rerank by revenue-first`;
      break;

    case "variant_dominance":
      action = "prioritise_variant";
      target = (opp.meta?.["bestVariant"] as string | undefined) ?? "C";
      reason = `variant ${target} dominates — lean into winning weight profile`;
      break;

    case "new_product_category":
      action = "expand_category";
      target = opp.name.replace(/\s+/g, "-");
      reason = `new product category signal: "${opp.name}"`;
      break;

    case "category_expansion":
      action = "adjust_revenue_bias";
      target = opp.name.replace(/\s+/g, "-");
      reason = `adjacent category "${opp.name}" shows revenue potential`;
      break;

    default:
      action = "adjust_relevance_bias";
      target = opp.name.replace(/\s+/g, "-");
      reason = opp.evidence;
  }

  const impact = Math.round(BASE_IMPACT[action] * opp.urgency * 100) / 100;

  return {
    action,
    target,
    priority:              opp.urgency,
    expectedRevenueImpact: impact,
    reason,
    sourceOpportunity:     opp.type,
  };
}

// ─── Main functions ───────────────────────────────────────────────────────────

/**
 * Generate a ranked list of strategies from detected opportunities.
 * Strategies are sorted by priority × expectedRevenueImpact (composite score).
 */
export function generateStrategies(opportunities: Opportunity[]): Strategy[] {
  const strategies = opportunities.map(opportunityToStrategy);

  return strategies.sort((a, b) => {
    const scoreA = a.priority * (1 + a.expectedRevenueImpact);
    const scoreB = b.priority * (1 + b.expectedRevenueImpact);
    return scoreB - scoreA;
  });
}

/**
 * Return the single highest-priority strategy, or null if none.
 */
export function getTopStrategy(opportunities: Opportunity[]): Strategy | null {
  const strategies = generateStrategies(opportunities);
  return strategies[0] ?? null;
}

/**
 * Filter strategies by action type.
 */
export function filterStrategiesByAction(
  strategies: Strategy[],
  action:     StrategyAction
): Strategy[] {
  return strategies.filter((s) => s.action === action);
}

/**
 * Deduplicate strategies — keeps highest-priority instance per target.
 */
export function deduplicateStrategies(strategies: Strategy[]): Strategy[] {
  const seen  = new Map<string, Strategy>();
  for (const s of strategies) {
    const key = `${s.action}:${s.target}`;
    const existing = seen.get(key);
    if (!existing || s.priority > existing.priority) seen.set(key, s);
  }
  return [...seen.values()].sort((a, b) => b.priority - a.priority);
}
