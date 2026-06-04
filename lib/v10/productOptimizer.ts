/**
 * V10 — Product Ranking Intelligence
 * Tracks product-level CTR from V6 events and applies dynamic
 * performance multipliers to V5 product ranking scores.
 *
 * Flow: V6 events → CTR stats → multipliers → adjusted V5 ranking
 */

import type { Product }     from "@/types/product";
import type { V6Event }     from "@/lib/v6/eventBus";
import { scoreProductForIntent } from "@/lib/v5/productRanker";
import type { IntentKey }   from "@/lib/v5/intentMatcher";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductStat = {
  productId:   string;
  impressions: number;
  clicks:      number;
  ctr:         number;
  affiliateClicks: number;
  conversionRate:  number;   // affiliateClicks / clicks
  multiplier:      number;   // applied to ranking score
};

export type OptimisedRanking = {
  product:       Product;
  baseScore:     number;
  multiplier:    number;
  adjustedScore: number;
  rank:          number;
};

// ─── In-memory stats store ────────────────────────────────────────────────────
// In production, replace with a persistent store (e.g. Supabase)

const productStats = new Map<string, ProductStat>();

// ─── Event ingestion ──────────────────────────────────────────────────────────

export function ingestEvent(event: V6Event): void {
  if (!event.productId) return;

  const id      = event.productId;
  const existing = productStats.get(id) ?? {
    productId:      id,
    impressions:    0,
    clicks:         0,
    ctr:            0,
    affiliateClicks: 0,
    conversionRate:  0,
    multiplier:     1.0,
  };

  if (event.type === "product_view")    existing.impressions    += 1;
  if (event.type === "affiliate_click") existing.affiliateClicks += 1;

  // Recalculate derived stats
  existing.ctr            = existing.impressions > 0 ? existing.clicks / existing.impressions : 0;
  existing.conversionRate = existing.clicks > 0 ? existing.affiliateClicks / existing.clicks : 0;
  existing.multiplier     = computeMultiplier(existing);

  productStats.set(id, existing);
}

export function ingestEvents(events: V6Event[]): void {
  for (const e of events) ingestEvent(e);
}

// ─── Multiplier logic ─────────────────────────────────────────────────────────

const MIN_IMPRESSIONS_FOR_LEARNING = 5;
const BOOST_CTR_THRESHOLD          = 0.08;   // 8% CTR → boost
const DECAY_CTR_THRESHOLD          = 0.02;   // <2% CTR → decay
const MAX_MULTIPLIER               = 1.5;
const MIN_MULTIPLIER               = 0.6;

function computeMultiplier(stat: ProductStat): number {
  if (stat.impressions < MIN_IMPRESSIONS_FOR_LEARNING) return 1.0;

  if (stat.ctr >= BOOST_CTR_THRESHOLD) {
    // Scale up proportionally — cap at MAX_MULTIPLIER
    return Math.min(1.0 + (stat.ctr - BOOST_CTR_THRESHOLD) * 5, MAX_MULTIPLIER);
  }

  if (stat.ctr < DECAY_CTR_THRESHOLD) {
    return Math.max(1.0 - (DECAY_CTR_THRESHOLD - stat.ctr) * 10, MIN_MULTIPLIER);
  }

  return 1.0;
}

// ─── Stat accessors ───────────────────────────────────────────────────────────

export function getProductStat(productId: string): ProductStat | undefined {
  return productStats.get(productId);
}

export function getMultiplier(productId: string): number {
  return productStats.get(productId)?.multiplier ?? 1.0;
}

export function getAllStats(): ProductStat[] {
  return Array.from(productStats.values());
}

// ─── Optimised ranking ────────────────────────────────────────────────────────

export function rankWithLearning(
  products: Product[],
  intent:   IntentKey,
  limit:    number = 5
): OptimisedRanking[] {
  return products
    .map((p) => {
      const baseScore    = scoreProductForIntent(p, intent);
      const multiplier   = getMultiplier(p.id);
      const adjustedScore = baseScore * multiplier;
      return { product: p, baseScore, multiplier, adjustedScore, rank: 0 };
    })
    .sort((a, b) => b.adjustedScore - a.adjustedScore)
    .slice(0, limit)
    .map((item, i) => ({ ...item, rank: i + 1 }));
}

// ─── Reporting ────────────────────────────────────────────────────────────────

export type ProductOptimiserReport = {
  generatedAt:     number;
  totalProducts:   number;
  learnedProducts: number;   // have enough data for multipliers
  topPerformers:   ProductStat[];
  underperformers: ProductStat[];
};

export function buildReport(): ProductOptimiserReport {
  const all     = getAllStats();
  const learned = all.filter((s) => s.impressions >= MIN_IMPRESSIONS_FOR_LEARNING);

  return {
    generatedAt:     Date.now(),
    totalProducts:   all.length,
    learnedProducts: learned.length,
    topPerformers:   learned.filter((s) => s.multiplier > 1.1).sort((a, b) => b.multiplier - a.multiplier),
    underperformers: learned.filter((s) => s.multiplier < 0.9).sort((a, b) => a.multiplier - b.multiplier),
  };
}
