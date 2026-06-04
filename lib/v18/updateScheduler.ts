/**
 * V18 Learning — Update Scheduler
 *
 * CRITICAL SAFETY LAYER: prevents runaway learning.
 *
 * Rules:
 *   1. Learning runs MAX once per 24 hours
 *   2. Minimum 50 signals required before any update
 *   3. Confidence threshold must be met (>= 0.3)
 *   4. Update is skipped if a rollback happened in the last 48 hours
 *
 * These rules prevent:
 *   - Feedback loops (not real-time, not continuous)
 *   - Instability spikes (minimum signal gate)
 *   - Post-rollback thrashing (cooldown after revert)
 */

import type { NormalisedSignal }   from "./signalNormalizer";
import { computeAdjustments }      from "./learningEngine";
import { writeWeightSnapshot,
         getCurrentWeights }       from "./weightStore";
import { assertSafeWeightUpdate }  from "./safetyContract";

// ─── Constants ────────────────────────────────────────────────────────────────

const ONE_DAY_MS         = 24 * 60 * 60 * 1000;
const MIN_SIGNALS        = 50;
const MIN_CONFIDENCE     = 0.30;
const ROLLBACK_COOLDOWN  = 48 * 60 * 60 * 1000;

// ─── State ────────────────────────────────────────────────────────────────────

let _lastUpdateAt:  number = 0;
let _lastRollbackAt: number = 0;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SchedulerResult {
  ran:       boolean;
  reason?:   string;   // why it was skipped
  version?:  string;   // new weight version if ran
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Determine if a learning update should run.
 * Returns true only when all safety conditions are met.
 */
export function shouldUpdate(now: number = Date.now()): boolean {
  return now - _lastUpdateAt > ONE_DAY_MS;
}

/** Signal that a rollback occurred (starts cooldown). */
export function recordRollback(): void {
  _lastRollbackAt = Date.now();
}

/**
 * Run a learning update if all conditions are satisfied.
 * Safe to call on every session — no-ops if conditions not met.
 */
export function maybeRunUpdate(
  signals: NormalisedSignal[],
  now:     number = Date.now(),
): SchedulerResult {
  // Rate limit: once per day
  if (!shouldUpdate(now)) {
    return { ran: false, reason: `Next update in ${Math.round((ONE_DAY_MS - (now - _lastUpdateAt)) / 3600000)}h` };
  }

  // Post-rollback cooldown
  if (_lastRollbackAt > 0 && now - _lastRollbackAt < ROLLBACK_COOLDOWN) {
    return { ran: false, reason: "Rollback cooldown active (48h)" };
  }

  // Minimum signal gate
  if (signals.length < MIN_SIGNALS) {
    return { ran: false, reason: `Insufficient signals: ${signals.length} < ${MIN_SIGNALS}` };
  }

  // Compute adjustments
  const adjustments = computeAdjustments(signals);

  // Confidence gate
  if (adjustments.confidence < MIN_CONFIDENCE) {
    return { ran: false, reason: `Confidence ${adjustments.confidence} < minimum ${MIN_CONFIDENCE}` };
  }

  // Build the weight update
  const current = getCurrentWeights();
  const update = {
    relevanceWeight:  current.relevanceWeight  + adjustments.relevanceWeightDelta,
    truthWeight:      current.truthWeight      + adjustments.truthWeightDelta,
    constraintWeight: current.constraintWeight + adjustments.constraintWeightDelta,
  };

  // Safety: assert update contains only allowed fields
  assertSafeWeightUpdate(update as Record<string, unknown>);

  // Write versioned snapshot
  const snapshot = writeWeightSnapshot(
    update,
    "learning",
    `Auto-update: ${signals.length} signals, confidence ${adjustments.confidence}`,
  );

  _lastUpdateAt = now;

  return { ran: true, version: snapshot.version };
}

export function getLastUpdateTime(): number {
  return _lastUpdateAt;
}

export function resetScheduler(): void {
  _lastUpdateAt   = 0;
  _lastRollbackAt = 0;
}
