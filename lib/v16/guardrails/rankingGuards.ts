/**
 * V16 Guardrails — Ranking integrity guards.
 *
 * Verifies that revenue data does not affect rank order for products
 * whose relevance scores differ by more than TIEBREAK_EPSILON.
 *
 * Invariant: for any two products A and B where |scoreA - scoreB| > EPSILON,
 * the product with the higher relevance score must rank higher.
 * Revenue may only influence ordering within the epsilon band.
 */

import type { RevenueEnrichedRecommendation } from "../types";
import type { GuardrailViolation }            from "../types";
import { TIEBREAK_EPSILON }                   from "../ranking/pureRanker";

export function checkRankingIntegrity(
  ranked: RevenueEnrichedRecommendation[],
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  for (let i = 0; i < ranked.length - 1; i++) {
    const higher = ranked[i];
    const lower  = ranked[i + 1];

    const scoreDiff = higher.score - lower.score;

    // Outside the epsilon band: the higher-ranked product MUST have a higher
    // or equal relevance score. If it doesn't, revenue leaked into ordering.
    if (Math.abs(scoreDiff) > TIEBREAK_EPSILON && scoreDiff < 0) {
      violations.push({
        rule: "RANKING_INTEGRITY",
        message:
          `Rank ${higher.rank} (score ${higher.score}) beats ` +
          `rank ${lower.rank} (score ${lower.score}) despite lower relevance. ` +
          `Score diff ${scoreDiff} exceeds epsilon ${TIEBREAK_EPSILON}. ` +
          `Revenue may have leaked into ordering.`,
        data: {
          higherRank:    higher.rank,
          higherScore:   higher.score,
          higherRevenue: higher.revenueScore,
          lowerRank:     lower.rank,
          lowerScore:    lower.score,
          lowerRevenue:  lower.revenueScore,
        },
      });
    }
  }

  return violations;
}
