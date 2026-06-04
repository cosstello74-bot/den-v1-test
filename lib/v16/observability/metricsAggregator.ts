/**
 * V16 Observability — Metrics Aggregator
 *
 * Combines outputs from all observability modules into a single
 * snapshot for logging, monitoring, or admin display.
 *
 * Call getObservabilitySnapshot() after a ranking call to capture
 * the full state of the observability pipeline.
 */

import type { RevenueEnrichedRecommendation } from "../types";
import type { DriftReport }                  from "./driftDetector";
import type { BiasReport }                   from "./biasDetector";
import type { TiebreakAuditEntry }           from "./revenueAudit";
import { getEvents, getQueueSize }           from "./eventCollector";
import { detectDrift }                       from "./driftDetector";
import { detectBias }                        from "./biasDetector";
import { auditRevenueTiebreaks, getTiebreakLog } from "./revenueAudit";
import { getSignalCount }                    from "./learningSignalStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ObservabilitySnapshot {
  timestamp:       number;
  category:        string;
  resultCount:     number;
  drift:           DriftReport;
  bias:            BiasReport;
  tiebreaks:       TiebreakAuditEntry[];
  eventQueueSize:  number;
  signalCount:     number;
  flags: {
    hasDrift:      boolean;
    hasBias:       boolean;
    hasTiebreaks:  boolean;
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Produce a full observability snapshot for a ranked result set.
 * Also triggers tiebreak audit as a side effect (emits events).
 */
export function getObservabilitySnapshot(
  category: string,
  ranked:   RevenueEnrichedRecommendation[],
): ObservabilitySnapshot {
  const drift      = detectDrift(category, ranked);
  const bias       = detectBias(category, ranked);
  const tiebreaks  = auditRevenueTiebreaks(category, ranked);

  return {
    timestamp:      Date.now(),
    category,
    resultCount:    ranked.length,
    drift,
    bias,
    tiebreaks,
    eventQueueSize: getQueueSize(),
    signalCount:    getSignalCount(),
    flags: {
      hasDrift:     drift.hasNotableDrift,
      hasBias:      bias.flags.length > 0,
      hasTiebreaks: tiebreaks.length > 0,
    },
  };
}

/**
 * Log the snapshot to the console in a structured format.
 * Use in development or server-side logging middleware.
 */
export function logSnapshot(snapshot: ObservabilitySnapshot): void {
  const { category, resultCount, flags } = snapshot;
  const flagStr = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ") || "none";

  console.info(
    `[V16 Obs] ${category} · ${resultCount} results · flags: ${flagStr}`,
    {
      drift:      snapshot.drift.entries.length,
      bias:       snapshot.bias.flags,
      tiebreaks:  snapshot.tiebreaks.length,
      events:     snapshot.eventQueueSize,
    },
  );
}
