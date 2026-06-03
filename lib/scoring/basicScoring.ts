/**
 * Phase 1 — Basic deterministic scoring.
 *
 * Rules:
 *   - NO truth model
 *   - NO revenue model
 *   - Pure user-profile × product-dimension matching
 *
 * Later phases layer truth and revenue multipliers ON TOP of this base.
 */

import type { UserProfile, Product, ScoringProfile } from "@/types/product";

// ─── Dimension weights per purpose ───────────────────────────────────────────

const PURPOSE_WEIGHTS: Record<UserProfile["purpose"], Partial<Record<keyof ScoringProfile, number>>> = {
  gaming:     { gaming_bonus: 0.40, value_bonus: 0.15 },
  work:       { productivity_bonus: 0.40, battery_bonus: 0.10 },
  creative:   { productivity_bonus: 0.30, portability_bonus: 0.10 },
  university: { value_bonus: 0.25, battery_bonus: 0.10, portability_bonus: 0.10 },
};

const BATTERY_WEIGHTS: Record<UserProfile["battery_importance"], number> = {
  "very-important":     0.20,
  "somewhat-important": 0.10,
  "not-important":      0.00,
};

const PORTABILITY_WEIGHTS: Record<UserProfile["portability"], number> = {
  "frequently-travel":   0.20,
  "occasionally-travel": 0.10,
  "desk-use":            0.00,
};

// ─── Score calculation ────────────────────────────────────────────────────────

export type BasicScoreResult = {
  total:        number;
  breakdown: {
    purpose:     number;
    battery:     number;
    portability: number;
    screen:      number;
    brand:       number;
  };
};

export function computeBasicScore(
  user:    UserProfile,
  product: Product,
  scoringProfile: ScoringProfile = {}
): BasicScoreResult {
  let purpose     = 0;
  let battery     = 0;
  let portability = 0;
  let screen      = 0;
  let brand       = 0;

  // Purpose-based dimension score
  const purposeWeights = PURPOSE_WEIGHTS[user.purpose] ?? {};
  if (purposeWeights.gaming_bonus       && product.gaming_score)
    purpose += product.gaming_score       * (purposeWeights.gaming_bonus ?? 0);
  if (purposeWeights.productivity_bonus && product.productivity_score)
    purpose += product.productivity_score * (purposeWeights.productivity_bonus ?? 0);
  if (purposeWeights.value_bonus        && product.value_score)
    purpose += product.value_score        * (purposeWeights.value_bonus ?? 0);
  if (purposeWeights.portability_bonus  && product.portability_score)
    purpose += product.portability_score  * (purposeWeights.portability_bonus ?? 0);

  // Battery
  battery = product.battery_score * BATTERY_WEIGHTS[user.battery_importance];

  // Portability
  portability = product.portability_score * PORTABILITY_WEIGHTS[user.portability];

  // Screen size match bonus
  if (user.screen_size !== "no-preference" && product.screen_size === user.screen_size) {
    screen = 10;
  }

  // Brand match bonus
  if (user.brand_preference !== "no-preference" && product.brand === user.brand_preference) {
    brand = 10;
  }

  // Category dimension bonuses from scoring profile
  const categoryBonus =
    (scoringProfile.battery_bonus      ?? 0) * product.battery_score +
    (scoringProfile.portability_bonus  ?? 0) * product.portability_score +
    (scoringProfile.gaming_bonus       ?? 0) * product.gaming_score +
    (scoringProfile.productivity_bonus ?? 0) * product.productivity_score +
    (scoringProfile.value_bonus        ?? 0) * product.value_score;

  const total = Math.round(purpose + battery + portability + screen + brand + categoryBonus);

  return { total, breakdown: { purpose, battery, portability, screen, brand } };
}

/**
 * Rank a list of products by basic score, highest first.
 */
export function rankProductsBasic(
  user:     UserProfile,
  products: Product[],
  scoringProfile: ScoringProfile = {}
): Array<{ product: Product; score: number }> {
  return products
    .map((p) => ({ product: p, score: computeBasicScore(user, p, scoringProfile).total }))
    .sort((a, b) => b.score - a.score);
}
