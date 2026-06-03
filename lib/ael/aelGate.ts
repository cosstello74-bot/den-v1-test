/**
 * AEL Activation Gate.
 *
 * Evaluates whether sufficient real-user signal exists to safely
 * activate autonomous page expansion.
 *
 * Unlock conditions (ANY one satisfied):
 *   A) 100+ unique sessions
 *   B) 20+  affiliate clicks
 *   C) 1+   confirmed conversion
 *
 * Designed to run at build time (scripts/ael-build.ts) or on-demand
 * via the AEL admin dashboard.
 */

import type { AggregatedIntelligence } from "@/lib/learning/eventAggregator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AelGateMetrics = {
  sessions:        number;
  affiliateClicks: number;
  conversions:     number;
};

export type AelGateStatus = {
  unlocked: boolean;
  reason:   string;
  progress: number;        // 0–1, highest threshold fraction reached
  metrics:  AelGateMetrics;
};

// ─── Thresholds ───────────────────────────────────────────────────────────────

export const AEL_GATE_THRESHOLDS = {
  sessions:        100,
  affiliateClicks: 20,
  conversions:     1,
} as const;

// ─── Gate evaluator ───────────────────────────────────────────────────────────

/**
 * Evaluate AEL gate status from aggregated event intelligence.
 */
export function evaluateAelGate(agg: AggregatedIntelligence): AelGateStatus {
  const sessions        = agg.sessions.totalSessions;
  const affiliateClicks = agg.funnel.affiliateClicks;
  const conversions     = Object.values(agg.products).reduce(
    (sum, p) => sum + p.confirmedConversions,
    0
  );

  const metrics: AelGateMetrics = { sessions, affiliateClicks, conversions };

  const t = AEL_GATE_THRESHOLDS;

  if (conversions >= t.conversions) {
    return {
      unlocked: true,
      reason:   `${conversions} confirmed conversion(s) — conversion signal achieved`,
      progress: 1,
      metrics,
    };
  }

  if (affiliateClicks >= t.affiliateClicks) {
    return {
      unlocked: true,
      reason:   `${affiliateClicks} affiliate clicks — click-through signal achieved`,
      progress: 1,
      metrics,
    };
  }

  if (sessions >= t.sessions) {
    return {
      unlocked: true,
      reason:   `${sessions} sessions — session volume threshold reached`,
      progress: 1,
      metrics,
    };
  }

  // Not yet unlocked — compute best-progress fraction
  const progress = Math.max(
    sessions        / t.sessions,
    affiliateClicks / t.affiliateClicks,
    conversions     / t.conversions,
  );

  const pct = Math.round(progress * 100);
  return {
    unlocked: false,
    reason: [
      `Awaiting signal: ${sessions}/${t.sessions} sessions,`,
      `${affiliateClicks}/${t.affiliateClicks} affiliate clicks,`,
      `${conversions}/${t.conversions} conversions`,
      `(${pct}% of closest threshold)`,
    ].join(" "),
    progress,
    metrics,
  };
}

/**
 * Simple boolean check — use when you only need the gate decision.
 */
export function isAelUnlocked(agg: AggregatedIntelligence): boolean {
  return evaluateAelGate(agg).unlocked;
}
