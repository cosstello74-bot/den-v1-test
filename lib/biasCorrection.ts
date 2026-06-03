import type { Event } from "@/types/event";

// Position weights: products shown higher get more clicks just from placement
const POSITION_WEIGHTS: Record<number, number> = { 1: 1.0, 2: 0.8, 3: 0.6 };
const DEFAULT_POSITION_WEIGHT = 0.4;

function getPositionWeight(rank: number): number {
  return POSITION_WEIGHTS[rank] ?? DEFAULT_POSITION_WEIGHT;
}

export type BiasCorrectedResult = {
  bias_corrected_ctr: number; // percentage, like weighted_ctr in IntelligenceModel
  raw_ctr: number;
  exposure_count: number;
};

// Corrects position bias by normalising click counts against position-weighted impressions
export function correctBias(events: Event[]): Record<string, BiasCorrectedResult> {
  const byProduct = new Map<string, Event[]>();
  for (const event of events) {
    if (!event.productId) continue;
    const existing = byProduct.get(event.productId) ?? [];
    existing.push(event);
    byProduct.set(event.productId, existing);
  }

  const results: Record<string, BiasCorrectedResult> = {};

  for (const [productId, productEvents] of Array.from(byProduct.entries())) {
    const impressions = productEvents.filter((e) => e.type === "product_viewed");
    const clicks = productEvents.filter(
      (e) => e.type === "product_clicked" || e.type === "affiliate_clicked"
    );

    const raw_ctr =
      impressions.length > 0 ? (clicks.length / impressions.length) * 100 : 0;

    // Weight each impression by position to correct for rank-order bias
    const weightedImpressions = impressions.reduce((sum, e) => {
      const rank = typeof e.metadata?.rank === "number" ? e.metadata.rank : 4;
      return sum + getPositionWeight(rank);
    }, 0);

    const bias_corrected_ctr =
      weightedImpressions > 0 ? (clicks.length / weightedImpressions) * 100 : 0;

    results[productId] = {
      bias_corrected_ctr,
      raw_ctr,
      exposure_count: impressions.length,
    };
  }

  return results;
}
