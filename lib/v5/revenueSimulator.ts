/**
 * v5 Revenue Simulator.
 *
 * Deterministic revenue simulation model per ranking variant.
 * NOT actual money tracking — models expected affiliate revenue
 * based on rank position, product attributes, and intent strength.
 *
 * Click rate decay by rank:
 *   rank 1 → 1.00, rank 2 → 0.65, rank 3 → 0.45,
 *   rank 4 → 0.30, rank 5+ → 0.20
 *
 * Per-product formula:
 *   affiliatePayout × conversionRate × rankClickRate × intentStrength
 */

import type { RankedProduct, VariantId } from "./variantEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevenueModelInput = {
  /** Affiliate commission rate for this product (0–1). Default: 0.04 */
  affiliateRate: number;
  /** Expected conversion rate for this product (0–1). Default: 0.02 */
  conversionRate: number;
  /** Current listed price in USD */
  priceUsd: number;
  /** Intent strength for the session (0–1). Default: 1.0 */
  intentStrength: number;
};

export type ProductRevenueBreakdown = {
  productId:     string;
  rank:          number;
  rankClickRate: number;
  affiliatePayout: number;  // priceUsd × affiliateRate
  expectedRevenue: number;  // affiliatePayout × conversionRate × rankClickRate × intentStrength
};

export type SimulationResult = {
  variant:          VariantId;
  expectedRevenue:  number;  // sum of all product expected revenues
  perProduct:       ProductRevenueBreakdown[];
};

export type RevenueModelSnapshot = {
  /** Map of product id → model inputs. Falls back to defaults for missing entries. */
  productModels: Record<string, Partial<RevenueModelInput>>;
  /** Global intent strength override (0–1). Default: 1.0 */
  intentStrength?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Rank position → click rate decay multiplier. */
export const RANK_CLICK_RATES: Record<number, number> = {
  1: 1.00,
  2: 0.65,
  3: 0.45,
  4: 0.30,
};

const DEFAULT_CLICK_RATE    = 0.20;  // rank 5+
const DEFAULT_AFFILIATE_RATE = 0.04;
const DEFAULT_CONVERSION_RATE = 0.02;
const DEFAULT_INTENT_STRENGTH = 1.0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the click rate multiplier for a given rank. */
export function getRankClickRate(rank: number): number {
  return RANK_CLICK_RATES[rank] ?? DEFAULT_CLICK_RATE;
}

/**
 * Simulate expected revenue for a single ranked product.
 */
export function simulateProductRevenue(
  productId:  string,
  rank:       number,
  priceUsd:   number,
  model:      Partial<RevenueModelInput> = {},
  intentStrength: number = DEFAULT_INTENT_STRENGTH
): ProductRevenueBreakdown {
  const affiliateRate   = model.affiliateRate   ?? DEFAULT_AFFILIATE_RATE;
  const conversionRate  = model.conversionRate  ?? DEFAULT_CONVERSION_RATE;
  const rankClickRate   = getRankClickRate(rank);
  const affiliatePayout = priceUsd * affiliateRate;
  const expectedRevenue = affiliatePayout * conversionRate * rankClickRate * intentStrength;

  return {
    productId,
    rank,
    rankClickRate,
    affiliatePayout: Math.round(affiliatePayout * 100) / 100,
    expectedRevenue:  Math.round(expectedRevenue * 10000) / 10000,
  };
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Simulate total expected revenue for a ranked product list under one variant.
 * Accepts the ranked output from rankForVariant() + a snapshot of model inputs.
 */
export function simulateVariantRevenue(
  variantId:     VariantId,
  rankedProducts: RankedProduct[],
  snapshot:      RevenueModelSnapshot = { productModels: {} }
): SimulationResult {
  const intentStrength = snapshot.intentStrength ?? DEFAULT_INTENT_STRENGTH;

  const perProduct: ProductRevenueBreakdown[] = rankedProducts.map((rp) => {
    const id    = rp.product.id;
    const price = (rp.product as { price?: number }).price ?? 0;
    const model = snapshot.productModels[id] ?? {};
    return simulateProductRevenue(id, rp.rank, price, model, intentStrength);
  });

  const expectedRevenue = perProduct.reduce((sum, p) => sum + p.expectedRevenue, 0);

  return {
    variant:         variantId,
    expectedRevenue: Math.round(expectedRevenue * 100) / 100,
    perProduct,
  };
}

/**
 * Run revenue simulation for all four variants and return results sorted
 * by expectedRevenue descending (best variant first).
 */
export function simulateAllVariants(
  variantRankings: Array<{ variant: VariantId; rankedProducts: RankedProduct[] }>,
  snapshot:        RevenueModelSnapshot = { productModels: {} }
): SimulationResult[] {
  const results = variantRankings.map((vr) =>
    simulateVariantRevenue(vr.variant, vr.rankedProducts, snapshot)
  );
  return results.sort((a, b) => b.expectedRevenue - a.expectedRevenue);
}

/**
 * Return the variant id with the highest simulated revenue.
 * If all variants produce 0, returns "C" (hybrid_balanced default).
 */
export function getBestRevenueVariant(results: SimulationResult[]): VariantId {
  if (results.length === 0) return "C";
  const sorted = [...results].sort((a, b) => b.expectedRevenue - a.expectedRevenue);
  return sorted[0].variant;
}
