/**
 * V17 Metrics — Per-cohort A/B measurement.
 *
 * Tracks V15 vs V16 user behaviour across the staged rollout.
 * Each metric event is tagged with the ranking version that served it
 * so the dashboard can compare cohorts cleanly.
 *
 * Metrics tracked:
 *   CTR                — clicks / impressions
 *   Revenue click rate — affiliate clicks / impressions
 *   Product clicks     — total product card clicks
 *   Dwell proxy        — time-on-results (approximated by scroll events)
 */

import type { RankingVersion } from "../rollout/trafficRouter";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CohortMetricEvent = {
  version:        RankingVersion;
  category:       string;
  sessionId:      string;
  type:           "impression" | "product_click" | "affiliate_click" | "dwell";
  productId?:     string;
  rank?:          number;
  dwellSeconds?:  number;
  timestamp:      number;
};

export interface CohortSummary {
  version:          RankingVersion;
  category:         string;
  impressions:      number;
  productClicks:    number;
  affiliateClicks:  number;
  ctr:              number;
  revenueClickRate: number;
  avgDwellSeconds:  number;
  sessionCount:     number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const MAX_EVENTS = 5000;
const _events: CohortMetricEvent[] = [];

// ─── Public API ───────────────────────────────────────────────────────────────

export function recordCohortEvent(event: CohortMetricEvent): void {
  _events.push(event);
  if (_events.length > MAX_EVENTS) _events.shift();
}

/**
 * Compute summary for a specific version + category combination.
 */
export function getCohortSummary(
  version:  RankingVersion,
  category: string,
): CohortSummary {
  const filtered = _events.filter(
    (e) => e.version === version && e.category === category,
  );

  const sessions       = new Set(filtered.map((e) => e.sessionId));
  const impressions    = filtered.filter((e) => e.type === "impression").length;
  const productClicks  = filtered.filter((e) => e.type === "product_click").length;
  const affiliateClicks = filtered.filter((e) => e.type === "affiliate_click").length;

  const dwellEvents   = filtered.filter((e) => e.type === "dwell" && e.dwellSeconds !== undefined);
  const totalDwell    = dwellEvents.reduce((sum, e) => sum + (e.dwellSeconds ?? 0), 0);
  const avgDwell      = dwellEvents.length > 0 ? totalDwell / dwellEvents.length : 0;

  return {
    version,
    category,
    impressions,
    productClicks,
    affiliateClicks,
    ctr:              impressions > 0 ? productClicks    / impressions : 0,
    revenueClickRate: impressions > 0 ? affiliateClicks  / impressions : 0,
    avgDwellSeconds:  Math.round(avgDwell * 10) / 10,
    sessionCount:     sessions.size,
  };
}

/**
 * Compare V15 vs V16 for a category. Returns deltas relative to V15 baseline.
 */
export function compareCohorts(category: string): {
  v15:          CohortSummary;
  v16:          CohortSummary;
  ctrDelta:     number;    // positive = V16 better
  revenueDelta: number;
  dwellDelta:   number;
} {
  const v15 = getCohortSummary("v15", category);
  const v16 = getCohortSummary("v16", category);

  return {
    v15,
    v16,
    ctrDelta:     v16.ctr              - v15.ctr,
    revenueDelta: v16.revenueClickRate  - v15.revenueClickRate,
    dwellDelta:   v16.avgDwellSeconds   - v15.avgDwellSeconds,
  };
}

export function clearCohortEvents(): void {
  _events.length = 0;
}

export function getEventCount(): number {
  return _events.length;
}
