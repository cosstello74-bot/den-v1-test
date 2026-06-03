import type { UserProfile, ProductWithMetrics, ScoringProfile } from "@/types/product";
import type { IntelligenceModel } from "./learningEngine";
import type { TruthModel } from "./truthModel";
import { ctrToMultiplier, truthScoreToMultiplier } from "./globalMultiplier";
import { detectSegment } from "./segment";

function calculateBaseScore(user: UserProfile, product: ProductWithMetrics): number {
  let score = 0;

  switch (user.purpose) {
    case "gaming":     score += product.gaming_score * 0.4; break;
    case "work":       score += product.productivity_score * 0.4; break;
    case "creative":   score += product.productivity_score * 0.3; break;
    case "university": score += product.value_score * 0.25; break;
  }

  switch (user.battery_importance) {
    case "very-important":     score += product.battery_score * 0.2; break;
    case "somewhat-important": score += product.battery_score * 0.1; break;
  }

  switch (user.portability) {
    case "frequently-travel":   score += product.portability_score * 0.2; break;
    case "occasionally-travel": score += product.portability_score * 0.1; break;
  }

  if (user.screen_size !== "no-preference" && product.screen_size === user.screen_size) {
    score += 10;
  }
  if (user.brand_preference !== "no-preference" && product.brand === user.brand_preference) {
    score += 10;
  }

  return score;
}

export function calculateScore(
  user: UserProfile,
  product: ProductWithMetrics,
  intelligence: IntelligenceModel | null,
  scoringProfile: ScoringProfile = {},
  truthModel?: TruthModel | null
): number {
  const base  = calculateBaseScore(user, product);
  const intel = intelligence?.products[product.id];
  const truth = truthModel?.products[product.id];

  // Segment multiplier — from intelligence model's per-segment CTR
  const segment = detectSegment(user.purpose);
  const segment_ctr = intel?.segment_ctr[segment] ?? (intel?.global_ctr ?? 0);
  const segment_multiplier = intel ? ctrToMultiplier(segment_ctr) : 1.0;

  // Truth multiplier — from verified outcome signal; neutral fallback when absent
  const truth_multiplier = truth ? truthScoreToMultiplier(truth.truth_score) : 1.0;

  // Bias-corrected CTR multiplier — from truth model; falls back to weighted CTR
  const bias_corrected_multiplier = truth
    ? ctrToMultiplier(truth.bias_corrected_ctr)
    : (intel ? ctrToMultiplier(intel.weighted_ctr) : 1.0);

  // Confidence weight — scales down scores for products with sparse outcome data
  const confidence_weight = truth?.confidence ?? 1.0;

  // Category-specific dimension bonuses
  const categoryBias =
    (scoringProfile.battery_bonus      ?? 0) * product.battery_score +
    (scoringProfile.portability_bonus  ?? 0) * product.portability_score +
    (scoringProfile.gaming_bonus       ?? 0) * product.gaming_score +
    (scoringProfile.productivity_bonus ?? 0) * product.productivity_score +
    (scoringProfile.value_bonus        ?? 0) * product.value_score;

  return Math.round(
    base * truth_multiplier * segment_multiplier * bias_corrected_multiplier * confidence_weight
    + categoryBias
  );
}

/**
 * v5 variant-aware scoring.
 * Applies variant weights to pre-computed dimension scores.
 * Normalises behaviour bias [−15, +20] → [0, 100] before weighting.
 * Returns a 0–100 composite score.
 */
export function scoreProductV5(
  relevanceScore: number,
  revenueScore:   number,
  behaviorBias:   number,
  weights: {
    relevanceWeight: number;
    revenueWeight:   number;
    behaviorWeight:  number;
  }
): number {
  const normalizedBehavior = Math.min(100, Math.max(0, Math.round(((behaviorBias + 15) / 35) * 100)));
  return Math.round(
    relevanceScore * weights.relevanceWeight +
    revenueScore   * weights.revenueWeight   +
    normalizedBehavior * weights.behaviorWeight
  );
}
