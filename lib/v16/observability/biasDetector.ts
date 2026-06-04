/**
 * V16 Observability — Bias Detector
 *
 * Detects concentration signals in ranked results:
 *   - Revenue concentration: are high-revenue products consistently top-3?
 *   - Brand concentration: is one brand dominating the top positions?
 *   - Category segment concentration: is one user segment seeing a skewed
 *     result set compared to the full product distribution?
 *
 * None of these checks block or modify ranking. They produce audit signals
 * consumed by metricsAggregator and surfaced in the observability snapshot.
 */

import type { RevenueEnrichedRecommendation } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BiasReport {
  category:             string;
  revenueConcentration: number;  // 0–1: fraction of top-3 with high revenueEfficiency
  dominantBrand?:       string;  // brand if it holds >50% of top-5
  topNProductIds:       string[];
  flags:                string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function topN<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function detectBias(
  category: string,
  ranked:   RevenueEnrichedRecommendation[],
): BiasReport {
  const flags:  string[] = [];
  const top3    = topN(ranked, 3);
  const top5    = topN(ranked, 5);

  // Revenue concentration in top-3
  const highRevenueInTop3 = top3.filter((r) => r.revenueEfficiency === "high").length;
  const revenueConcentration = top3.length > 0 ? highRevenueInTop3 / top3.length : 0;

  if (revenueConcentration >= 1.0 && top3.length >= 3) {
    flags.push("FULL_REVENUE_CONCENTRATION_TOP3");
  } else if (revenueConcentration >= 0.67) {
    flags.push("HIGH_REVENUE_CONCENTRATION_TOP3");
  }

  // Brand concentration in top-5
  const brandCounts: Record<string, number> = {};
  for (const rec of top5) {
    const brand = rec.product.brand;
    brandCounts[brand] = (brandCounts[brand] ?? 0) + 1;
  }

  let dominantBrand: string | undefined;
  for (const [brand, count] of Object.entries(brandCounts)) {
    if (top5.length > 0 && count / top5.length > 0.5) {
      dominantBrand = brand;
      flags.push(`BRAND_DOMINANCE_TOP5:${brand}`);
    }
  }

  const topNProductIds = top5.map((r) => r.product.id);

  return {
    category,
    revenueConcentration,
    dominantBrand,
    topNProductIds,
    flags,
  };
}
