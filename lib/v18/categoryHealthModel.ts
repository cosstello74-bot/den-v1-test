/**
 * V18 Learning — Category Health Model
 *
 * Computes a health score per category based on user engagement signals.
 * Used by the learning engine to determine if category-specific weight
 * adjustments are warranted.
 *
 * Health score components:
 *   ctrScore        — CTR relative to a 5% baseline
 *   conversionScore — affiliate click rate relative to a 1% baseline
 *   engagementScore — average dwell time (30s baseline)
 *   diversityScore  — spread of clicks across products (1 = perfect spread)
 *
 * Status thresholds:
 *   healthy   — score >= 0.7
 *   degraded  — score >= 0.4
 *   critical  — score < 0.4
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategorySignalSummary {
  category:          string;
  impressions:       number;
  clicks:            number;
  affiliateClicks:   number;
  avgDwellSeconds:   number;
  uniqueProductsClicked: number;
  totalProducts:     number;
}

export interface CategoryHealthResult {
  category:        string;
  healthScore:     number;              // 0–1
  status:          "healthy" | "degraded" | "critical";
  ctrScore:        number;
  conversionScore: number;
  engagementScore: number;
  diversityScore:  number;
  signals:         number;              // total impressions used
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeCategoryHealth(
  summary: CategorySignalSummary,
): CategoryHealthResult {
  const { category, impressions, clicks, affiliateClicks, avgDwellSeconds,
    uniqueProductsClicked, totalProducts } = summary;

  const BASELINE_CTR        = 0.05;
  const BASELINE_CONVERSION = 0.01;
  const BASELINE_DWELL      = 30;    // seconds

  const ctr        = impressions > 0 ? clicks         / impressions : 0;
  const conversion = impressions > 0 ? affiliateClicks / impressions : 0;

  // Scores: 0.5 at baseline, scales linearly
  const ctrScore        = clamp01(ctr        / (BASELINE_CTR        * 2));
  const conversionScore = clamp01(conversion / (BASELINE_CONVERSION * 2));
  const engagementScore = clamp01(avgDwellSeconds / (BASELINE_DWELL * 2));
  const diversityScore  = totalProducts > 0 ? clamp01(uniqueProductsClicked / totalProducts) : 0.5;

  // Weighted composite
  const healthScore = Math.round(
    (ctrScore * 0.35 + conversionScore * 0.30 + engagementScore * 0.20 + diversityScore * 0.15) * 100,
  ) / 100;

  const status: CategoryHealthResult["status"] =
    healthScore >= 0.7 ? "healthy" :
    healthScore >= 0.4 ? "degraded" : "critical";

  return {
    category,
    healthScore,
    status,
    ctrScore:        Math.round(ctrScore        * 100) / 100,
    conversionScore: Math.round(conversionScore * 100) / 100,
    engagementScore: Math.round(engagementScore * 100) / 100,
    diversityScore:  Math.round(diversityScore  * 100) / 100,
    signals:         impressions,
  };
}

export function computeAllCategoryHealth(
  summaries: CategorySignalSummary[],
): CategoryHealthResult[] {
  return summaries.map(computeCategoryHealth);
}
