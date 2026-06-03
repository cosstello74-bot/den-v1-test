/**
 * Phase 4 — Truth engine facade.
 *
 * Unifies the truth model, outcome engine, bias correction, and confidence
 * system into a single import surface.
 *
 * Phase 4 scoring formula:
 *   final_score = 0.6 × truth_score + 0.4 × revenue_score
 *
 * Truth score bands → multipliers:
 *   ≥ 0.8  → 1.30×  (verified positive outcomes)
 *   ≥ 0.5  → 1.15×  (mixed or neutral)
 *   ≥ 0.3  → 1.00×  (sparse negative signal)
 *   ≥ 0.1  → 0.85×  (poor outcome signal)
 *   < 0.1  → 0.70×  (strong negative signal)
 */

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
  buildTruthModel,
  mergeTruthModels,
} from "@/lib/truthModel";

export type {
  ProductTruth,
  TruthModel,
} from "@/lib/truthModel";

export { truthScoreToMultiplier }     from "@/lib/globalMultiplier";
export { getConfidenceWeight, getConfidenceScore } from "@/lib/confidence";
export { applyTruthDecay, truthDecayWeight }       from "@/lib/timeDecay";
export { evaluateOutcome }            from "@/lib/outcomeEngine";
export { correctBias }                from "@/lib/biasCorrection";

// ─── Phase 4 composite scorer ────────────────────────────────────────────────

import type { ProductTruth, TruthModel } from "@/lib/truthModel";
import { truthScoreToMultiplier }    from "@/lib/globalMultiplier";

/**
 * Phase 4 final display score.
 * truthContribution = truthScoreToMultiplier(truth_score) × confidence × base
 * revenueContribution = revenueScore (0–100)
 *
 * Returns: 0.6 × truth_contribution + 0.4 × revenueScore
 */
export function computePhase4Score(
  baseScore:    number,
  revenueScore: number,
  truthModel:   TruthModel | null,
  productId:    string
): number {
  const truth = truthModel?.products[productId];
  const truthMult   = truth ? truthScoreToMultiplier(truth.truth_score) : 1.0;
  const confidence  = truth?.confidence ?? 1.0;
  const truthScore  = baseScore * truthMult * confidence;

  return Math.round(0.6 * truthScore + 0.4 * revenueScore);
}

/**
 * Describe a product's truth signal in human-readable form.
 */
export function describeTruthSignal(truth: ProductTruth | undefined): {
  label:  string;
  colour: "emerald" | "indigo" | "amber" | "red";
} {
  if (!truth) return { label: "No data", colour: "amber" };
  if (truth.truth_score >= 0.7)  return { label: "Verified", colour: "emerald" };
  if (truth.truth_score >= 0.5)  return { label: "Mixed signals", colour: "indigo" };
  if (truth.truth_score >= 0.3)  return { label: "Sparse data", colour: "amber" };
  return { label: "Poor signal", colour: "red" };
}
