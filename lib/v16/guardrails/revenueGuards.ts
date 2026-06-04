/**
 * V16 Guardrails — Revenue isolation guards.
 *
 * Verifies the architectural invariant: revenue is annotation-only.
 *
 * Invariants checked:
 *   1. compositeScore === rec.score for every recommendation
 *      (revenue must not have been blended into the displayed score)
 *   2. revenueScore is within [0, 100] for every recommendation
 *      (prevents outlier values from distorting tiebreaker behaviour)
 */

import type { RevenueEnrichedRecommendation } from "../types";
import type { GuardrailViolation }            from "../types";

export function checkRevenueIsolation(
  ranked: RevenueEnrichedRecommendation[],
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  for (const rec of ranked) {
    // Invariant 1: compositeScore must equal relevance score
    if (rec.compositeScore !== rec.score) {
      violations.push({
        rule:    "REVENUE_IN_COMPOSITE_SCORE",
        message: `Product ${rec.product.id} has compositeScore (${rec.compositeScore}) !== score (${rec.score}). ` +
                 `Revenue has leaked into the composite score.`,
        data:    {
          productId:     rec.product.id,
          score:         rec.score,
          compositeScore: rec.compositeScore,
          revenueScore:  rec.revenueScore,
        },
      });
    }

    // Invariant 2: revenueScore must be in [0, 100]
    if (rec.revenueScore < 0 || rec.revenueScore > 100) {
      violations.push({
        rule:    "REVENUE_SCORE_OUT_OF_RANGE",
        message: `Product ${rec.product.id} has revenueScore ${rec.revenueScore} outside [0, 100].`,
        data:    { productId: rec.product.id, revenueScore: rec.revenueScore },
      });
    }
  }

  return violations;
}
