/**
 * Phase 8 — Composite scoring namespace.
 *
 * Re-exports the composite ranking engine and adds descriptive helpers.
 * This is the single import point for all composite score operations.
 *
 * Architecture: ranking is purely relevance-driven.
 * Revenue is annotation-only metadata; it does not affect rank position.
 * See compositeRanking.ts for tiebreaker details.
 */

export {
  applyCompositeRanking,
} from "@/lib/compositeRanking";

export type {
  RevenueEnrichedRecommendation,
} from "@/lib/compositeRanking";

// ─── Descriptive helpers ──────────────────────────────────────────────────────

/**
 * Human-readable label and colour for a composite score.
 */
export function describeCompositeScore(score: number): {
  label:  string;
  colour: "emerald" | "indigo" | "amber" | "gray";
} {
  if (score >= 80) return { label: "Excellent",    colour: "emerald" };
  if (score >= 65) return { label: "Strong",       colour: "indigo"  };
  if (score >= 50) return { label: "Good",         colour: "amber"   };
  return             { label: "Below average", colour: "gray"    };
}

/**
 * Score delta between intelligence-only rank and composite rank.
 * Positive = revenue boosted this product up. Negative = penalised.
 */
export function rankMovement(
  intelligenceRank: number,
  compositeRank:    number
): { delta: number; direction: "up" | "down" | "unchanged" } {
  const delta = intelligenceRank - compositeRank;
  return {
    delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "unchanged",
  };
}
