/**
 * V16 Shared Configuration
 *
 * Single source of truth for tuneable constants used across the V16
 * plugin engine, guardrails, and observability layers.
 *
 * Change these values here; all modules import from this file.
 */

/**
 * Score gap below which the revenue tiebreaker activates.
 *
 * Two products within TIEBREAK_EPSILON points of each other are considered
 * "tied" and may be broken by revenueScore. Genuine relevance differences
 * (> epsilon) always produce revenue-blind ordering.
 *
 * Default: 3 points on a 0–100 scale.
 */
export const TIEBREAK_EPSILON = 3;
