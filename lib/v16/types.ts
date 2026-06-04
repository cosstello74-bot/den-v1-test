/**
 * V16 shared types.
 *
 * Single source of truth for cross-cutting V16 interfaces.
 * Re-exports UserContext so compositeRanking.ts doesn't need
 * to import from revenueEngine directly (Phase 5 boundary enforcement).
 *
 * RevenueEnrichedRecommendation is defined here (not in compositeRanking.ts)
 * so that applyMonetisation.ts can reference it without creating a circular
 * dependency.
 */

import type { Recommendation } from "@/types/product";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type { UserContext }    from "../revenueEngine";
export type { ScoringSignals as FeatureVector } from "../v15/categoryScoring";

// ─── Recommendation types ─────────────────────────────────────────────────────

export type RevenueEnrichedRecommendation = Recommendation & {
  revenueScore:      number;
  compositeScore:    number;
  revenueEfficiency: "high" | "medium" | "low";
  /** Human-readable explanation of why this rank was assigned. */
  rankReasoning:     string;
};

// ─── Plugin validation ────────────────────────────────────────────────────────

export interface ValidationResult {
  valid:         boolean;
  missingFields: string[];
  warnings:      string[];
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

/** Minimum shape required by the pure ranker. */
export interface Rankable {
  score:         number;
  revenueScore?: number;
}

// ─── Shadow comparison ────────────────────────────────────────────────────────

export interface ShadowDiff {
  divergedCount: number;
  topChanged:    boolean;
  details: Array<{
    productId: string;
    v15Rank:   number;
    v16Rank:   number;
    delta:     number;
  }>;
}

// ─── Guardrails ───────────────────────────────────────────────────────────────

export interface GuardrailViolation {
  rule:    string;
  message: string;
  data?:   unknown;
}
