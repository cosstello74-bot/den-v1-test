/**
 * Phase 3 — Revenue engine namespace.
 *
 * Re-exports the core revenue engine and adds Phase-3 convenience helpers.
 *
 * Phase 3 scoring formula:
 *   display_score = basic_score + revenue_score
 *
 * (Phase 4 replaces this with: 0.6 × truth_score + 0.4 × revenue_score)
 */

export {
  calculateRevenueScore,
} from "@/lib/revenueEngine";

export type {
  UserContext,
  RevenueScoreOutput,
} from "@/lib/revenueEngine";

import type { UserProfile }          from "@/types/product";
import type { RevenueModelSnapshot } from "@/lib/metrics/revenueMetrics";
import { calculateRevenueScore }     from "@/lib/revenueEngine";
import { detectSegment }             from "@/lib/segment";

// ─── Phase 3 composite: basic + revenue ──────────────────────────────────────

/**
 * Phase 3 display score = basicScore + normalised revenue contribution.
 * Revenue score (0–100) is scaled ÷ 5 to avoid overwhelming the basic signal.
 */
export function computePhase3Score(
  basicScore:  number,
  productId:   string,
  revenueModel: RevenueModelSnapshot,
  user:        UserProfile,
  trafficSource: string = "unknown"
): number {
  const ctx    = { user, trafficSource };
  const revOut = calculateRevenueScore(productId, revenueModel, ctx);
  return Math.round(basicScore + revOut.revenueScore / 5);
}

/**
 * Rank products using Phase 3 score (basic + revenue).
 */
export function rankByRevenueAware<T extends { id: string }>(
  products:    T[],
  basicScores: Record<string, number>,
  revenueModel: RevenueModelSnapshot,
  user:        UserProfile,
  trafficSource = "unknown"
): Array<{ product: T; score: number; revenueScore: number }> {
  const segment = detectSegment(user.purpose);

  return products
    .map((p) => {
      const basic  = basicScores[p.id] ?? 0;
      const revOut = calculateRevenueScore(p.id, revenueModel, { user, trafficSource });
      return { product: p, score: Math.round(basic + revOut.revenueScore / 5), revenueScore: revOut.revenueScore };
    })
    .sort((a, b) => b.score - a.score);
}
