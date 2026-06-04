/**
 * Composite ranking — display layer only.
 * Does NOT modify the intelligence model, truth model, or any persisted state.
 *
 * Architecture: revenue is ANNOTATION ONLY — it never affects rank position.
 *
 *   finalScore    = relevanceScore          (determines rank)
 *   revenueScore  = metadata annotation     (displayed, not ranked on)
 *   compositeScore = relevanceScore         (same — kept for type compatibility)
 *
 * Tiebreaker: when two products are within TIEBREAK_EPSILON of each other,
 * revenueScore breaks the tie. This is the only point revenue touches order.
 * A 3-point epsilon means two products must score identically or near-identically
 * before commission data has any effect — genuine user-fit differences always win.
 *
 * V5 compatibility note:
 * V5 Variant B ("revenue_first", 55% revenue weight) is architecturally
 * incompatible with the revenue-neutrality contract enforced here.
 * Any resurrection of V5 Variant B MUST NOT be wired into this module.
 * If A/B testing is required, use the V17 rollout controller instead.
 *
 * V16 layer separation:
 *   Revenue enrichment  →  v16/monetisation/applyMonetisation
 *   Sorting             →  v16/ranking/pureRanker
 *   This file           →  thin coordinator; no direct revenueEngine import
 */
import type { Recommendation }       from "@/types/product";
import type { RevenueModelSnapshot } from "./metrics/revenueMetrics";
import { applyMonetisation }         from "./v16/monetisation/applyMonetisation";
import { rankProducts }              from "./v16/ranking/pureRanker";
import type { RevenueEnrichedRecommendation, UserContext } from "./v16/types";

// Re-export types so existing importers (results page, compositeScoring) need no changes.
export type { RevenueEnrichedRecommendation, UserContext };

export function applyCompositeRanking(
  recommendations: Recommendation[],
  revenueModel:    RevenueModelSnapshot | null,
  context:         UserContext,
): RevenueEnrichedRecommendation[] {
  // Step 1: annotate with revenue metadata (no rank change)
  const enriched = applyMonetisation(recommendations, revenueModel, context);

  // Step 2: sort by relevance; revenue tiebreaker within epsilon=3
  const ranked = rankProducts(enriched);

  // Step 3: assign 1-based rank positions
  ranked.forEach((r, i) => { r.rank = i + 1; });

  return ranked;
}
