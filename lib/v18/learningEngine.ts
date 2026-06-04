/**
 * V18 Learning — Learning Engine
 *
 * Computes incremental weight adjustments from normalised user signals.
 *
 * HARD CONTRACT — V18 CAN ONLY TOUCH:
 *   scoring weights (relevanceWeight, truthWeight, constraintWeight)
 *   feature importance hints
 *   category tuning parameters
 *
 * V18 CANNOT TOUCH:
 *   ranking order            ← enforced by safetyContract.ts
 *   revenue logic            ← enforced by safetyContract.ts
 *   category routing         ← enforced by safetyContract.ts
 *   guardrails               ← enforced by safetyContract.ts
 *   composite ranking logic  ← enforced by safetyContract.ts
 *
 * Adjustments are SMALL and CLAMPED:
 *   relevanceWeightDelta ∈ [−0.02, +0.02]
 *   truthWeightDelta     ∈ [−0.01, +0.01]
 *
 * This prevents runaway learning even if the signal data is noisy.
 */

import type { NormalisedSignal }   from "./signalNormalizer";
import { assertLearningBoundary }  from "./safetyContract";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LearningAdjustments {
  relevanceWeightDelta:  number;   // [−0.02, +0.02]
  truthWeightDelta:      number;   // [−0.01, +0.01]
  constraintWeightDelta: number;   // [−0.02, +0.02]
  confidence:            number;   // 0–1; low if few signals
  signalCount:           number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function computeCTR(signals: NormalisedSignal[]): number {
  if (signals.length === 0) return 0;
  return signals.filter((s) => s.clicked).length / signals.length;
}

function computeAvgDwell(signals: NormalisedSignal[]): number {
  if (signals.length === 0) return 0;
  return signals.reduce((sum, s) => sum + s.dwellTime, 0) / signals.length;
}

function computeDismissRate(signals: NormalisedSignal[]): number {
  if (signals.length === 0) return 0;
  return signals.filter((s) => s.dismissed).length / signals.length;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute weight adjustments from a batch of normalised signals.
 * Does NOT write to weightStore — the caller (updateScheduler) decides when to write.
 *
 * Learning signal interpretation:
 *   High CTR vs 5% baseline → relevance weights are working well → small positive delta
 *   High dwell (> 30s) → results feel relevant → small positive truth delta
 *   High dismiss rate → results may be off → small negative relevance delta
 *
 * Confidence scales down adjustments when signal count is low.
 * Minimum 50 signals required before any meaningful adjustment.
 */
export function computeAdjustments(
  signals: NormalisedSignal[],
): LearningAdjustments {
  // Safety: assert this function is not being called from a ranking context
  assertLearningBoundary("computeAdjustments");

  const BASELINE_CTR   = 0.05;  // 5% expected CTR
  const BASELINE_DWELL = 30;    // 30 seconds expected dwell

  const ctr         = computeCTR(signals);
  const dwell       = computeAvgDwell(signals);
  const dismissRate = computeDismissRate(signals);

  // Confidence: low if fewer than 50 signals (scale 0→1 over 50–200 signals)
  const confidence = Math.min(1.0, Math.max(0, (signals.length - 50) / 150));

  // Relevance delta: positive when CTR exceeds baseline; negative on high dismissal
  const ctrSignal      = clamp((ctr - BASELINE_CTR) * 0.1, -0.02, 0.02);
  const dismissPenalty = clamp(dismissRate * -0.05, -0.02, 0);
  const relevanceDelta = clamp((ctrSignal + dismissPenalty) * confidence, -0.02, 0.02);

  // Truth delta: positive when dwell exceeds baseline (users engaging with results)
  const dwellSignal  = clamp((dwell - BASELINE_DWELL) * 0.001, -0.01, 0.01);
  const truthDelta   = clamp(dwellSignal * confidence, -0.01, 0.01);

  // Constraint delta: mild tightening when top-ranked clicked items match constraints
  // Simple proxy: high CTR with low rank = constraints are helping surface good results
  const topClicks     = signals.filter((s) => s.clicked && s.rank <= 3).length;
  const topClickRate  = signals.length > 0 ? topClicks / signals.length : 0;
  const constraintDelta = clamp((topClickRate - 0.03) * 0.1 * confidence, -0.02, 0.02);

  return {
    relevanceWeightDelta:  Math.round(relevanceDelta  * 10000) / 10000,
    truthWeightDelta:      Math.round(truthDelta       * 10000) / 10000,
    constraintWeightDelta: Math.round(constraintDelta  * 10000) / 10000,
    confidence:            Math.round(confidence       * 100)   / 100,
    signalCount:           signals.length,
  };
}
