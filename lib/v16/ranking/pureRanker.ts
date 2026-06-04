/**
 * V16 Phase 3 — Pure Ranker
 *
 * Sorts any list of Rankable objects by relevance score (descending).
 *
 * Tiebreaker: when two scores are within TIEBREAK_EPSILON, the product
 * with the higher revenueScore wins. This is the ONLY point at which
 * revenue data may influence ordering — genuine relevance differences
 * (> epsilon) always produce revenue-blind ordering.
 *
 * Generic over T extends Rankable so it can rank any enriched type
 * without coupling to a specific recommendation shape.
 *
 * Invariant: rankProducts(rankProducts(items)) === rankProducts(items)
 *            (stable, idempotent sort)
 */

import type { Rankable } from "../types";

/** Score gap below which the revenue tiebreaker activates. */
export const TIEBREAK_EPSILON = 3;

/**
 * Sort items by relevance score descending.
 * Ties within TIEBREAK_EPSILON are broken by revenueScore descending.
 * Returns a new array; input is not mutated.
 */
export function rankProducts<T extends Rankable>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const diff = b.score - a.score;
    if (Math.abs(diff) > TIEBREAK_EPSILON) return diff;
    return (b.revenueScore ?? 0) - (a.revenueScore ?? 0);
  });
}
