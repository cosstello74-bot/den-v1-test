/**
 * v5 Multi-Variant Ranking Engine.
 *
 * Generates four deterministic ranking strategies simultaneously.
 * Each variant applies different scoring weights to the same pre-computed
 * input scores (intelligence, revenue, behaviour).
 *
 * Variants:
 *   A — relevance_first     : 70% intelligence, 20% revenue, 10% behaviour
 *   B — revenue_first       : 30% intelligence, 55% revenue, 15% behaviour
 *   C — hybrid_balanced     : 50% intelligence, 35% revenue, 15% behaviour
 *   D — engagement_weighted : 45% intelligence, 30% revenue, 25% behaviour
 *
 * The engine is a pure function — no I/O, no side effects.
 * Persistence (evolved weights, performance data) lives in weightOptimizer
 * and performanceTracker.
 */

import type { Product } from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VariantId       = "A" | "B" | "C" | "D";
export type VariantStrategy =
  | "relevance_first"
  | "revenue_first"
  | "hybrid_balanced"
  | "engagement_weighted";

export type VariantWeights = {
  relevanceWeight: number;   // intelligence score weight  (0–1)
  revenueWeight:   number;   // revenue score weight       (0–1)
  behaviorWeight:  number;   // behaviour bias weight      (0–1)
  // invariant: relevanceWeight + revenueWeight + behaviorWeight === 1.0
};

export type ProductScoreInput = {
  product:           Product;
  intelligenceScore: number;   // 0–100 — from calculateScore()
  revenueScore:      number;   // 0–100 — from calculateRevenueScore()
  behaviorBias:      number;   // −15 to +20 — from computeAdjustmentMap()
};

export type RankedProduct = ProductScoreInput & {
  variantScore:     number;   // final weighted score for this variant
  normalizedBehavior: number; // bias normalised to 0–100 scale
  rank:             number;
};

export type VariantResult = {
  variant:          VariantId;
  strategy:         VariantStrategy;
  weights:          VariantWeights;
  rankedProducts:   RankedProduct[];
  predictedRevenue: number;  // from revenueSimulator — injected by caller
};

// ─── Static base profiles ─────────────────────────────────────────────────────

/** Base (seed) weight profiles for each variant. Evolved weights override these at runtime. */
export const BASE_VARIANT_PROFILES: Record<VariantId, {
  strategy: VariantStrategy;
  weights:  VariantWeights;
}> = {
  A: {
    strategy: "relevance_first",
    weights:  { relevanceWeight: 0.70, revenueWeight: 0.20, behaviorWeight: 0.10 },
  },
  B: {
    strategy: "revenue_first",
    weights:  { relevanceWeight: 0.30, revenueWeight: 0.55, behaviorWeight: 0.15 },
  },
  C: {
    strategy: "hybrid_balanced",
    weights:  { relevanceWeight: 0.50, revenueWeight: 0.35, behaviorWeight: 0.15 },
  },
  D: {
    strategy: "engagement_weighted",
    weights:  { relevanceWeight: 0.45, revenueWeight: 0.30, behaviorWeight: 0.25 },
  },
};

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Normalise behaviour bias [−15, +20] → [0, 100].
 * Zero bias → ~43 (below neutral due to asymmetric range).
 */
export function normalizeBehaviorBias(bias: number): number {
  return Math.min(100, Math.max(0, Math.round(((bias + 15) / 35) * 100)));
}

/**
 * Apply variant weights to pre-computed scores.
 * Returns a 0–100 composite score.
 */
export function applyVariantWeights(
  intelligenceScore: number,
  revenueScore:      number,
  behaviorBias:      number,
  weights:           VariantWeights
): number {
  const nb = normalizeBehaviorBias(behaviorBias);
  return Math.round(
    intelligenceScore * weights.relevanceWeight +
    revenueScore      * weights.revenueWeight   +
    nb                * weights.behaviorWeight
  );
}

// ─── Main functions ───────────────────────────────────────────────────────────

/**
 * Rank a product list using a single variant's weights.
 * Returns products sorted by variant score, with rank assigned.
 */
export function rankForVariant(
  inputs:  ProductScoreInput[],
  weights: VariantWeights
): RankedProduct[] {
  const scored: RankedProduct[] = inputs.map((input) => {
    const nb           = normalizeBehaviorBias(input.behaviorBias);
    const variantScore = applyVariantWeights(
      input.intelligenceScore,
      input.revenueScore,
      input.behaviorBias,
      weights
    );
    return { ...input, variantScore, normalizedBehavior: nb, rank: 0 };
  });

  scored.sort((a, b) => b.variantScore - a.variantScore);
  scored.forEach((p, i) => { p.rank = i + 1; });

  return scored;
}

/**
 * Generate rankings for ALL four variants simultaneously.
 * Accepts optional evolved weights that override the base profiles.
 */
export function generateAllVariants(
  inputs:        ProductScoreInput[],
  evolvedWeights?: Partial<Record<VariantId, VariantWeights>>
): Omit<VariantResult, "predictedRevenue">[] {
  return (Object.keys(BASE_VARIANT_PROFILES) as VariantId[]).map((variantId) => {
    const profile = BASE_VARIANT_PROFILES[variantId];
    const weights = evolvedWeights?.[variantId] ?? profile.weights;

    return {
      variant:        variantId,
      strategy:       profile.strategy,
      weights,
      rankedProducts: rankForVariant(inputs, weights),
    };
  });
}

/**
 * Get the ranking for a single variant.
 * Used when the caller already knows which variant this session is assigned to.
 */
export function getVariantRanking(
  inputs:         ProductScoreInput[],
  variantId:      VariantId,
  evolvedWeights?: Partial<Record<VariantId, VariantWeights>>
): Omit<VariantResult, "predictedRevenue"> {
  const profile = BASE_VARIANT_PROFILES[variantId];
  const weights = evolvedWeights?.[variantId] ?? profile.weights;

  return {
    variant:        variantId,
    strategy:       profile.strategy,
    weights,
    rankedProducts: rankForVariant(inputs, weights),
  };
}

/**
 * Validate that weights sum to 1.0 (within floating-point tolerance).
 */
export function validateWeights(w: VariantWeights): boolean {
  const sum = w.relevanceWeight + w.revenueWeight + w.behaviorWeight;
  return Math.abs(sum - 1.0) < 0.001;
}

/**
 * Normalise weights to sum exactly to 1.0.
 */
export function normalizeWeights(w: VariantWeights): VariantWeights {
  const sum = w.relevanceWeight + w.revenueWeight + w.behaviorWeight;
  if (sum === 0) return { relevanceWeight: 0.50, revenueWeight: 0.35, behaviorWeight: 0.15 };
  return {
    relevanceWeight: Math.round((w.relevanceWeight / sum) * 1000) / 1000,
    revenueWeight:   Math.round((w.revenueWeight   / sum) * 1000) / 1000,
    behaviorWeight:  Math.round((w.behaviorWeight  / sum) * 1000) / 1000,
  };
}
