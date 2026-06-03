/**
 * Composite ranking — display layer only.
 * Does NOT modify the intelligence model, truth model, or any persisted state.
 *
 * final_score = 0.6 × intelligence_score + 0.4 × revenue_score
 */
import type { Recommendation }       from "@/types/product";
import type { RevenueModelSnapshot } from "./metrics/revenueMetrics";
import type { UserContext }          from "./revenueEngine";
import { calculateRevenueScore }     from "./revenueEngine";

export type RevenueEnrichedRecommendation = Recommendation & {
  revenueScore:    number;
  compositeScore:  number;
  revenueEfficiency: "high" | "medium" | "low";
};

const INTELLIGENCE_WEIGHT = 0.6;
const REVENUE_WEIGHT      = 0.4;

export function computeCompositeScore(intelligenceScore: number, revenueScore: number): number {
  return Math.round(
    INTELLIGENCE_WEIGHT * intelligenceScore + REVENUE_WEIGHT * revenueScore
  );
}

function revenueEfficiencyLabel(revenueScore: number): "high" | "medium" | "low" {
  if (revenueScore >= 65) return "high";
  if (revenueScore >= 35) return "medium";
  return "low";
}

export function applyCompositeRanking(
  recommendations: Recommendation[],
  revenueModel:    RevenueModelSnapshot | null,
  context:         UserContext
): RevenueEnrichedRecommendation[] {
  const enriched = recommendations.map((rec): RevenueEnrichedRecommendation => {
    const revenueOut = revenueModel
      ? calculateRevenueScore(rec.product.id, revenueModel, context)
      : { revenueScore: 50 };

    const revenueScore   = revenueOut.revenueScore;
    const compositeScore = computeCompositeScore(rec.score, revenueScore);

    return {
      ...rec,
      revenueScore,
      compositeScore,
      revenueEfficiency: revenueEfficiencyLabel(revenueScore),
    };
  });

  // Re-rank by composite score, re-assign rank numbers
  enriched.sort((a, b) => b.compositeScore - a.compositeScore);
  enriched.forEach((r, i) => { r.rank = i + 1; });

  return enriched;
}
