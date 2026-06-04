/**
 * V5 — Product Ranker
 * Ranks products for a given intent using weighted scoring.
 * Deterministic — same products + intent always produce the same ranking.
 */

import type { Product } from "@/types/product";
import { getIntentProfile } from "./intentMatcher";
import type { IntentKey }  from "./intentMatcher";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RankedProduct = {
  product:        Product;
  intentScore:    number;   // weighted composite score for this intent
  rank:           number;
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function scoreProductForIntent(product: Product, intent: IntentKey): number {
  const profile = getIntentProfile(intent);
  if (!profile) return 0;

  const w = profile.scoreWeights;

  return (
    (product.gaming_score       * (w.gaming_score       ?? 0)) +
    (product.productivity_score * (w.productivity_score ?? 0)) +
    (product.battery_score      * (w.battery_score      ?? 0)) +
    (product.portability_score  * (w.portability_score  ?? 0)) +
    (product.value_score        * (w.value_score        ?? 0))
  );
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export function filterForIntent(products: Product[], intent: IntentKey): Product[] {
  const profile = getIntentProfile(intent);
  if (!profile) return products;

  return products.filter((p) => {
    const min = profile.minScores;

    if (min.gaming_score       !== undefined && p.gaming_score       < min.gaming_score)       return false;
    if (min.productivity_score !== undefined && p.productivity_score < min.productivity_score) return false;
    if (min.battery_score      !== undefined && p.battery_score      < min.battery_score)      return false;
    if (min.portability_score  !== undefined && p.portability_score  < min.portability_score)  return false;
    if (min.value_score        !== undefined && p.value_score        < min.value_score)        return false;

    if (
      profile.priceBands &&
      profile.priceBands.length > 0 &&
      !profile.priceBands.includes(p.price_band)
    ) return false;

    return true;
  });
}

// ─── Ranker ───────────────────────────────────────────────────────────────────

export function rankProductsForIntent(
  products: Product[],
  intent:   IntentKey,
  limit:    number = 5
): RankedProduct[] {
  const profile = getIntentProfile(intent);
  if (!profile) return [];

  const eligible = filterForIntent(
    products.filter((p) => p.category === profile.category),
    intent
  );

  return eligible
    .map((p) => ({ product: p, intentScore: scoreProductForIntent(p, intent), rank: 0 }))
    .sort((a, b) => b.intentScore - a.intentScore)
    .slice(0, limit)
    .map((item, i) => ({ ...item, rank: i + 1 }));
}
