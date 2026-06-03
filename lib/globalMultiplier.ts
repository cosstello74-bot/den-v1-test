import type { IntelligenceModel } from "./learningEngine";

export function ctrToMultiplier(ctr: number): number {
  if (ctr > 12) return 1.30;
  if (ctr >= 8)  return 1.15;
  if (ctr >= 4)  return 1.00;
  if (ctr >= 2)  return 0.85;
  return 0.70;
}

export function getGlobalMultiplier(productId: string, model: IntelligenceModel): number {
  const intel = model.products[productId];
  if (!intel) return 1.0;
  return ctrToMultiplier(intel.weighted_ctr);
}

// Truth score → multiplier (same band structure as CTR, different input domain)
export function truthScoreToMultiplier(score: number): number {
  if (score >= 0.8) return 1.30;
  if (score >= 0.5) return 1.15;
  if (score >= 0.3) return 1.00;
  if (score >= 0.1) return 0.85;
  return 0.70;
}
