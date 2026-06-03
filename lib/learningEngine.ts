import { applyDecay, computeTimeDecayFactor } from "./timeDecay";
import { SEGMENTS } from "./segment";
import type { Event } from "@/types/event";
import type { SegmentType } from "@/types/event";

export type ProductIntelligence = {
  global_ctr: number;
  weighted_ctr: number;
  time_decay_factor: number;
  trend: "rising" | "stable" | "declining";
  segment_ctr: Record<SegmentType, number>;
};

export type IntelligenceModel = {
  generatedAt: string;
  products: Record<string, ProductIntelligence>;
};

export function processEventBatch(events: Event[]): IntelligenceModel {
  const now = Date.now();

  // Group all events by productId
  const byProduct = new Map<string, Event[]>();
  for (const event of events) {
    if (!event.productId) continue;
    const existing = byProduct.get(event.productId) ?? [];
    existing.push(event);
    byProduct.set(event.productId, existing);
  }

  const products: Record<string, ProductIntelligence> = {};

  for (const [productId, productEvents] of Array.from(byProduct.entries())) {
    const impressionEvents = productEvents.filter((e) => e.type === "product_viewed");
    const clickEvents      = productEvents.filter(
      (e) => e.type === "product_clicked" || e.type === "affiliate_clicked"
    );

    // Raw CTR
    const rawImpressions = impressionEvents.length;
    const rawClicks      = clickEvents.length;
    const global_ctr     = rawImpressions > 0 ? (rawClicks / rawImpressions) * 100 : 0;

    // Time-weighted CTR — recent events carry more weight
    const weightedImpressions = impressionEvents.reduce((sum, e) => {
      const ageDays = (now - e.timestamp) / 86_400_000;
      return sum + applyDecay(ageDays);
    }, 0);
    const weightedClicks = clickEvents.reduce((sum, e) => {
      const ageDays = (now - e.timestamp) / 86_400_000;
      return sum + applyDecay(ageDays);
    }, 0);
    const weighted_ctr = weightedImpressions > 0 ? (weightedClicks / weightedImpressions) * 100 : 0;

    // Time decay factor for scoring
    const mostRecent = clickEvents.length > 0
      ? Math.max(...clickEvents.map((e) => e.timestamp))
      : null;
    const time_decay_factor = computeTimeDecayFactor(mostRecent);

    // Trend: weighted CTR vs raw CTR
    let trend: ProductIntelligence["trend"] = "stable";
    if (rawImpressions >= 5) {
      if (weighted_ctr > global_ctr * 1.1)      trend = "rising";
      else if (weighted_ctr < global_ctr * 0.9)  trend = "declining";
    }

    // Segment-level CTR
    const segment_ctr = {} as Record<SegmentType, number>;
    for (const segment of SEGMENTS) {
      const segEvents = productEvents.filter((e) => e.metadata?.segment === segment);
      const segImpr   = segEvents.filter((e) => e.type === "product_viewed").length;
      const segClicks = segEvents.filter(
        (e) => e.type === "product_clicked" || e.type === "affiliate_clicked"
      ).length;
      segment_ctr[segment] = segImpr > 0 ? (segClicks / segImpr) * 100 : 0;
    }

    products[productId] = { global_ctr, weighted_ctr, time_decay_factor, trend, segment_ctr };
  }

  return { generatedAt: new Date().toISOString(), products };
}

// Merge a freshly derived model on top of a seeded baseline
export function mergeIntelligence(
  baseline: IntelligenceModel,
  derived: IntelligenceModel
): IntelligenceModel {
  const merged = structuredClone(baseline);
  for (const [productId, intel] of Object.entries(derived.products)) {
    merged.products[productId] = intel;
  }
  merged.generatedAt = derived.generatedAt;
  return merged;
}
