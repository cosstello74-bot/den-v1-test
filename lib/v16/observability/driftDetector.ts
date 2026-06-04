/**
 * V16 Observability — Drift Detector
 *
 * Compares the current rank order against a stored baseline and flags
 * products that have drifted more than DRIFT_THRESHOLD positions.
 *
 * Baseline = the rank order from 7 days ago for the same category.
 * Stored in memory; can be seeded from a persistence layer.
 *
 * Drift > 3 positions on a top-5 product is flagged as notable.
 */

import type { RevenueEnrichedRecommendation } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriftEntry {
  productId:     string;
  baselineRank:  number;
  currentRank:   number;
  drift:         number;      // currentRank - baselineRank (positive = fell, negative = rose)
}

export interface DriftReport {
  category:        string;
  hasNotableDrift: boolean;
  entries:         DriftEntry[];
  baselineAge?:    number;    // ms since baseline was recorded
}

// ─── In-memory baselines ──────────────────────────────────────────────────────

interface BaselineEntry {
  ranks:       Record<string, number>; // productId → rank
  recordedAt:  number;                 // Unix ms
}

const DRIFT_THRESHOLD    = 3;          // positions
const BASELINE_TTL_MS    = 7 * 24 * 60 * 60 * 1000; // 7 days

const _baselines = new Map<string, BaselineEntry>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Record the current rank order as the baseline for this category.
 * Call once per day (or after any deliberate model update).
 */
export function recordBaseline(
  category: string,
  ranked:   RevenueEnrichedRecommendation[],
): void {
  const ranks: Record<string, number> = {};
  for (const rec of ranked) {
    ranks[rec.product.id] = rec.rank;
  }
  _baselines.set(category, { ranks, recordedAt: Date.now() });
}

/**
 * Compare the current ranked list against the stored baseline.
 * Returns a DriftReport. If no baseline exists, hasNotableDrift = false.
 */
export function detectDrift(
  category: string,
  ranked:   RevenueEnrichedRecommendation[],
): DriftReport {
  const baseline = _baselines.get(category);

  if (!baseline) {
    return { category, hasNotableDrift: false, entries: [] };
  }

  const age = Date.now() - baseline.recordedAt;

  const entries: DriftEntry[] = [];

  for (const rec of ranked) {
    const baselineRank = baseline.ranks[rec.product.id];
    if (baselineRank === undefined) continue;

    const drift = rec.rank - baselineRank;
    if (Math.abs(drift) >= DRIFT_THRESHOLD) {
      entries.push({
        productId:    rec.product.id,
        baselineRank,
        currentRank:  rec.rank,
        drift,
      });
    }
  }

  const hasNotableDrift = entries.some(
    (e) => e.baselineRank <= 5 && Math.abs(e.drift) >= DRIFT_THRESHOLD,
  );

  return {
    category,
    hasNotableDrift,
    entries,
    baselineAge: age,
  };
}

/** Clear all baselines (test isolation). */
export function clearBaselines(): void {
  _baselines.clear();
}
