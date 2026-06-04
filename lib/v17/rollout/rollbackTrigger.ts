/**
 * V17 Rollout — Auto Rollback Trigger
 *
 * Monitors per-cohort metrics and automatically reverts to V15
 * if any threshold is breached. Called after each ranking cycle
 * when ENABLE_ROLLBACK_MONITORING is true.
 *
 * Thresholds (relative to V15 baseline):
 *   CTR drop     > 15%   → rollback
 *   Revenue drop > 10%   → rollback
 *   Drift score  > 0.30  → rollback
 *   Category imbalance increases  → rollback
 */

import { emergencyRollback } from "./rolloutController";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CohortMetricSnapshot {
  ctr:               number;   // 0–1
  revenueClickRate:  number;   // 0–1
  driftScore:        number;   // 0–1
  categoryImbalance: number;   // 0–1 (higher = more skewed)
}

export interface RollbackCheckResult {
  shouldRollback: boolean;
  reason?:        string;
  metrics:        CohortMetricSnapshot;
  baseline:       CohortMetricSnapshot;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  CTR_DROP_MAX:              0.15,  // 15% relative drop
  REVENUE_CLICK_DROP_MAX:    0.10,  // 10% relative drop
  DRIFT_SCORE_MAX:           0.30,
  CATEGORY_IMBALANCE_DELTA:  0.10,  // absolute increase
} as const;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check if V16 metrics breach rollback thresholds vs V15 baseline.
 * Returns result — does NOT call emergencyRollback() automatically;
 * the caller decides whether to act.
 */
export function checkRollbackConditions(
  v16:      CohortMetricSnapshot,
  baseline: CohortMetricSnapshot,
): RollbackCheckResult {
  // CTR relative drop
  const ctrDrop = baseline.ctr > 0
    ? (baseline.ctr - v16.ctr) / baseline.ctr
    : 0;

  if (ctrDrop > THRESHOLDS.CTR_DROP_MAX) {
    return {
      shouldRollback: true,
      reason:  `CTR dropped ${(ctrDrop * 100).toFixed(1)}% (threshold: ${THRESHOLDS.CTR_DROP_MAX * 100}%)`,
      metrics:  v16,
      baseline,
    };
  }

  // Revenue click relative drop
  const revDrop = baseline.revenueClickRate > 0
    ? (baseline.revenueClickRate - v16.revenueClickRate) / baseline.revenueClickRate
    : 0;

  if (revDrop > THRESHOLDS.REVENUE_CLICK_DROP_MAX) {
    return {
      shouldRollback: true,
      reason:  `Revenue click rate dropped ${(revDrop * 100).toFixed(1)}% (threshold: ${THRESHOLDS.REVENUE_CLICK_DROP_MAX * 100}%)`,
      metrics:  v16,
      baseline,
    };
  }

  // Drift score absolute
  if (v16.driftScore > THRESHOLDS.DRIFT_SCORE_MAX) {
    return {
      shouldRollback: true,
      reason:  `Drift score ${v16.driftScore.toFixed(2)} exceeds threshold ${THRESHOLDS.DRIFT_SCORE_MAX}`,
      metrics:  v16,
      baseline,
    };
  }

  // Category imbalance increase
  const imbalanceDelta = v16.categoryImbalance - baseline.categoryImbalance;
  if (imbalanceDelta > THRESHOLDS.CATEGORY_IMBALANCE_DELTA) {
    return {
      shouldRollback: true,
      reason:  `Category imbalance increased by ${imbalanceDelta.toFixed(2)} (threshold: ${THRESHOLDS.CATEGORY_IMBALANCE_DELTA})`,
      metrics:  v16,
      baseline,
    };
  }

  return { shouldRollback: false, metrics: v16, baseline };
}

/**
 * Check conditions and trigger emergency rollback if thresholds are breached.
 * Safe to call on every ranking cycle.
 */
export function checkAndRollbackIfNeeded(
  v16:      CohortMetricSnapshot,
  baseline: CohortMetricSnapshot,
): RollbackCheckResult {
  const result = checkRollbackConditions(v16, baseline);

  if (result.shouldRollback && result.reason) {
    emergencyRollback(result.reason);
  }

  return result;
}
