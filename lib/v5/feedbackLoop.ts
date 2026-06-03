/**
 * v5 Feedback Loop.
 *
 * Session-end weight update cycle.
 *
 * Flow:
 *   1. Read current performance metrics from performanceTracker
 *   2. Evaluate which variant performed best (affiliate CTR primary)
 *   3. Run weight optimizer — all variants step toward best variant's profile
 *   4. Persist updated weights to localStorage via weightOptimizer
 *   5. Return a summary of what changed
 *
 * Designed to be called once per session on page unload or quiz completion.
 * SSR-safe — all localStorage access is guarded in the underlying modules.
 */

import type { VariantId } from "./variantEngine";
import type { OptimizationStep } from "./weightOptimizer";
import type { PerformanceStore } from "./performanceTracker";
import { getBestPerformingVariant, getAllMetrics } from "./performanceTracker";
import { optimizeAllWeights, loadWeightStore } from "./weightOptimizer";
import type { WeightStore } from "./weightOptimizer";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackLoopResult = {
  sessionBestVariant: VariantId;
  optimizationSteps:  OptimizationStep[];
  updatedWeights:     WeightStore;
  metricsSnapshot:    PerformanceStore;
  skipped:            boolean;
  skipReason?:        string;
};

export type FeedbackLoopConfig = {
  /**
   * Minimum number of affiliate clicks required across all variants
   * before any weight update is applied.
   * Prevents noise from low-signal sessions.
   * Default: 1
   */
  minSignalThreshold: number;
  /** Learning rate override. Default: 0.05 */
  learningRate?: number;
};

export const DEFAULT_FEEDBACK_CONFIG: FeedbackLoopConfig = {
  minSignalThreshold: 1,
  learningRate:       0.05,
};

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Run the full feedback loop for the session.
 * Called once at session end (e.g. beforeunload or quiz completion).
 */
export function runFeedbackLoop(
  cfg: FeedbackLoopConfig = DEFAULT_FEEDBACK_CONFIG
): FeedbackLoopResult {
  const metricsSnapshot = getAllMetrics();

  // Check minimum signal threshold
  const totalAffiliateClicks = (["A", "B", "C", "D"] as VariantId[]).reduce(
    (sum, id) => sum + metricsSnapshot[id].affiliateClicks,
    0
  );

  if (totalAffiliateClicks < cfg.minSignalThreshold) {
    return {
      sessionBestVariant: "C",
      optimizationSteps:  [],
      updatedWeights:     loadWeightStore(),
      metricsSnapshot,
      skipped:            true,
      skipReason:         `insufficient signal: ${totalAffiliateClicks} affiliate click(s) < threshold ${cfg.minSignalThreshold}`,
    };
  }

  const sessionBestVariant = getBestPerformingVariant();
  const { store: updatedWeights, steps } = optimizeAllWeights(
    sessionBestVariant,
    cfg.learningRate ?? 0.05
  );

  return {
    sessionBestVariant,
    optimizationSteps:  steps,
    updatedWeights,
    metricsSnapshot,
    skipped:            false,
  };
}

/**
 * Register a beforeunload handler that triggers the feedback loop once.
 * Safe to call in a useEffect — cleans up on unmount.
 * Returns the cleanup function.
 */
export function registerSessionEndHandler(
  cfg: FeedbackLoopConfig = DEFAULT_FEEDBACK_CONFIG
): () => void {
  if (typeof window === "undefined") return () => undefined;

  let fired = false;
  const handler = () => {
    if (!fired) {
      fired = true;
      runFeedbackLoop(cfg);
    }
  };

  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
}
