import type { UserProfile }        from "@/types/product";
import type { RevenueModelSnapshot } from "./metrics/revenueMetrics";
import { getSegmentRevenueMultiplier } from "./segmentRevenue";
import { getTrafficWeight }            from "./trafficWeights";
import { detectSegment }               from "./segment";

export type UserContext = {
  user:          UserProfile;
  trafficSource: string;
  sessionId?:    string;
};

export type RevenueScoreOutput = {
  productId:           string;
  revenueScore:        number;
  affiliateValue:      number;
  conversionProbability: number;
  intentStrength:      number;
  segmentMultiplier:   number;
  trafficWeight:       number;
};

/**
 * Intent strength = weighted composite of user-profile signals.
 * Higher budget + purposeful use case → stronger purchase intent.
 */
function calculateIntentStrength(user: UserProfile): number {
  let strength = 0.5; // baseline

  // Budget signal
  switch (user.budget) {
    case "1500+":      strength += 0.25; break;
    case "1000-1500":  strength += 0.18; break;
    case "500-1000":   strength += 0.10; break;
    case "under-500":  strength += 0.00; break;
  }

  // Purpose signal
  switch (user.purpose) {
    case "work":       strength += 0.15; break;
    case "creative":   strength += 0.12; break;
    case "gaming":     strength += 0.08; break;
    case "university": strength += 0.03; break;
  }

  // Specificity signals — strong preferences show deliberate intent
  if (user.brand_preference !== "no-preference") strength += 0.05;
  if (user.screen_size       !== "no-preference") strength += 0.03;

  return Math.min(strength, 1.0);
}

/**
 * revenueScore = affiliate_value × conversion_probability × intent_strength
 *                × segment_multiplier × traffic_source_weight
 *
 * Normalised to a 0–100 range (÷ max theoretical value of ~£95 × 0.15 × 1.0 × 1.30 × 1.0 ≈ 18.5).
 */
const NORMALISER = 20;

export function calculateRevenueScore(
  productId: string,
  revenueModel: RevenueModelSnapshot,
  context: UserContext
): RevenueScoreOutput {
  const data = revenueModel.products[productId];

  const affiliateValue      = data?.affiliatePayout  ?? 20;
  const conversionProbability = data?.conversionRate ?? 0.06;

  const intentStrength    = calculateIntentStrength(context.user);
  const segment           = detectSegment(context.user.purpose);
  const segmentMultiplier = getSegmentRevenueMultiplier(segment);
  const trafficWeight     = getTrafficWeight(context.trafficSource);

  const raw = affiliateValue * conversionProbability * intentStrength * segmentMultiplier * trafficWeight;
  const revenueScore = Math.min(Math.round((raw / NORMALISER) * 100), 100);

  return {
    productId,
    revenueScore,
    affiliateValue,
    conversionProbability,
    intentStrength:    Math.round(intentStrength * 100) / 100,
    segmentMultiplier,
    trafficWeight,
  };
}
