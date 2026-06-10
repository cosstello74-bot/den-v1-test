/**
 * V16 Phase 3 — Pure Ranker
 *
 * Sorts any list of Rankable objects by relevance score (descending).
 *
 * Revenue neutrality: ordering is determined SOLELY by relevance score.
 * Commission / revenueScore NEVER influences rank — not even as a tiebreaker.
 * This makes the public "not what paid the highest commission" promise
 * literally true at every score margin. revenueScore is retained on the
 * enriched type for display/analytics only, never for ordering.
 *
 * When two products score identically, JS stable sort preserves their
 * upstream (relevance) order — still revenue-blind.
 *
 * Generic over T extends Rankable so it can rank any enriched type
 * without coupling to a specific recommendation shape.
 *
 * Invariant: rankProducts(rankProducts(items)) === rankProducts(items)
 *            (stable, idempotent sort)
 */

import type { Rankable }      from "../types";
import { TIEBREAK_EPSILON }   from "../config";

// Re-exported for backwards compatibility with existing importers.
// No longer used for ordering — see revenue-neutrality note above.
export { TIEBREAK_EPSILON };

/**
 * Sort items by relevance score descending. Revenue-blind.
 * Returns a new array; input is not mutated.
 */
export function rankProducts<T extends Rankable>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}
