/**
 * V16 Phase 4 — Monetisation Layer
 *
 * Annotates recommendations with revenue metadata.
 * Revenue is ANNOTATION ONLY: it never modifies .score, .rank, or sort order.
 * Sorting is the responsibility of pureRanker.rankProducts().
 *
 * Extracted from compositeRanking.ts so that compositeRanking.ts no longer
 * imports from revenueEngine directly (Phase 5 boundary enforcement).
 *
 * Architecture:
 *   compositeRanking.ts  →  applyMonetisation()  →  revenueEngine
 *   compositeRanking.ts  ✗→ revenueEngine          (direct import removed)
 */

import type { Recommendation }              from "@/types/product";
import type { RevenueModelSnapshot }        from "../../metrics/revenueMetrics";
import { calculateRevenueScore }            from "../../revenueEngine";
import type { RevenueEnrichedRecommendation, UserContext } from "../types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function revenueEfficiencyLabel(revenueScore: number): "high" | "medium" | "low" {
  if (revenueScore >= 65) return "high";
  if (revenueScore >= 35) return "medium";
  return "low";
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Enrich each recommendation with revenue metadata.
 *
 * Input recs are unchanged. Returns a new array of
 * RevenueEnrichedRecommendation with .revenueScore,
 * .revenueEfficiency, and .rankReasoning added.
 *
 * compositeScore === rec.score always: revenue does not modify the
 * displayed score. This is the architectural invariant.
 */
export function applyMonetisation(
  recommendations: Recommendation[],
  revenueModel:    RevenueModelSnapshot | null,
  context:         UserContext,
): RevenueEnrichedRecommendation[] {
  return recommendations.map((rec): RevenueEnrichedRecommendation => {
    const revenueOut = revenueModel
      ? calculateRevenueScore(rec.product.id, revenueModel, context)
      : { revenueScore: 50 };

    const revenueScore  = revenueOut.revenueScore;
    const topStrengths  = rec.strengths.slice(0, 2).join("; ") || "category match";
    const rankReasoning = `Score ${rec.score}/100 — ${topStrengths}`;

    return {
      ...rec,
      revenueScore,
      compositeScore:    rec.score,   // revenue does not modify the displayed score
      revenueEfficiency: revenueEfficiencyLabel(revenueScore),
      rankReasoning,
    };
  });
}
