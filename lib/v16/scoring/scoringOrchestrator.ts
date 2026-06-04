/**
 * V16 Phase 2 — Scoring Orchestrator
 *
 * Wraps calculateScore() to expose structured component scores.
 * Consumers can inspect { relevanceScore, constraintBonus, raw } to
 * understand how a score was composed — useful for debugging, audit
 * logs, and the observability layer.
 *
 * NO behaviour change. Delegates entirely to the existing calculateScore().
 * The `raw` field is always equal to `relevanceScore`; both are provided
 * so callers can be explicit about which they're using as the ranking key.
 */

import type { ProductWithMetrics, ScoringProfile } from "@/types/product";
import type { IntelligenceModel }                  from "../../learningEngine";
import type { TruthModel }                         from "../../truthModel";
import type { ScoringSignals }                     from "../../v15/categoryScoring";
import { calculateScore }                          from "../../scoring";

// ─── Output type ──────────────────────────────────────────────────────────────

export interface OrchestratedScore {
  /** Final relevance score (0–100). This is the canonical ranking key. */
  relevanceScore: number;

  /**
   * Constraint bonus contribution to the score:
   *   +10 for screen_size match
   *   +10 for brand_preference match
   * Provided for transparency; already baked into relevanceScore.
   */
  constraintBonus: number;

  /** Direct output of calculateScore(). Always === relevanceScore. */
  raw: number;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export function orchestrateScore(
  signals:        ScoringSignals,
  product:        ProductWithMetrics,
  intelligence:   IntelligenceModel | null,
  scoringProfile: ScoringProfile,
  truthModel?:    TruthModel | null,
): OrchestratedScore {
  const raw = calculateScore(signals, product, intelligence, scoringProfile, truthModel);

  // Constraint bonus: screen_size match (+10) and brand match (+10).
  // This mirrors the logic in scoring.ts calculateBaseScore() so the
  // decomposition is accurate even as the underlying function evolves.
  const constraintBonus =
    (signals.screen_size !== "no-preference" && product.screen_size === signals.screen_size ? 10 : 0) +
    (signals.brand_preference !== "no-preference" && product.brand === signals.brand_preference ? 10 : 0);

  return {
    relevanceScore:  raw,
    constraintBonus,
    raw,
  };
}
