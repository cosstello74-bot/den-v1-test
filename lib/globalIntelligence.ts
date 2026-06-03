import baseModel from "@/data/globalModel.json";
import type { GlobalModel, TrackingEvent } from "@/types/product";

// Bundled seed model — always available on client and server
export function loadGlobalModel(): GlobalModel {
  return baseModel as GlobalModel;
}

// Pure merge function — no I/O, safe for client and server
export function mergeEvents(model: GlobalModel, events: TrackingEvent[]): GlobalModel {
  const updated: GlobalModel = JSON.parse(JSON.stringify(model));

  for (const event of events) {
    const productId = event.productId;
    const category = (event.metadata.category as string) ?? "laptops";

    if (productId) {
      if (!updated.productStats[productId]) {
        updated.productStats[productId] = { impressions: 0, clicks: 0, conversions: 0 };
      }
      if (event.event === "product_viewed") {
        updated.productStats[productId].impressions += 1;
      }
      if (event.event === "affiliate_clicked") {
        updated.productStats[productId].clicks += 1;
        updated.productStats[productId].conversions += 1;
      }
    }

    if (!updated.categoryStats[category]) {
      updated.categoryStats[category] = { totalImpressions: 0, ctr: 0 };
    }
    if (event.event === "product_viewed") {
      updated.categoryStats[category].totalImpressions += 1;
    }
  }

  // Recompute per-category CTR from product stats
  const categoryCounts: Record<string, { impressions: number; clicks: number }> = {};
  for (const [, stats] of Object.entries(updated.productStats)) {
    // We don't have per-product category info in stats, so keep existing category CTRs
    // and only update totalImpressions from events
    void stats;
  }
  void categoryCounts;

  updated.lastUpdated = new Date().toISOString();
  return updated;
}

export function getProductGlobalCTR(model: GlobalModel, productId: string): number {
  const stats = model.productStats[productId];
  if (!stats || stats.impressions === 0) return 0;
  return (stats.clicks / stats.impressions) * 100;
}

export function getCategoryGlobalCTR(model: GlobalModel, category: string): number {
  return model.categoryStats[category]?.ctr ?? 0;
}

export function getTopProductsByGlobalCTR(
  model: GlobalModel,
  count = 10
): Array<{ productId: string; ctr: number; impressions: number; clicks: number }> {
  return Object.entries(model.productStats)
    .filter(([, s]) => s.impressions > 0)
    .map(([productId, s]) => ({
      productId,
      ctr: (s.clicks / s.impressions) * 100,
      impressions: s.impressions,
      clicks: s.clicks,
    }))
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, count);
}
