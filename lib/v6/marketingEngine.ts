/**
 * v6 Autonomous Marketing Engine.
 *
 * Simulates marketing decisions without external tools.
 * Identifies best-performing landing pages, simulates content amplification,
 * and adjusts internal link weights and SEO/GEO priority signals.
 *
 * All decisions are deterministic and rule-based.
 * No external API calls, no real ad spend.
 */

import type { TrafficSignal } from "./opportunityDetector";
import type { Strategy }      from "./strategyEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AmplificationReason =
  | "high_conversion_high_intent"
  | "high_traffic_low_ctr_recovery"
  | "strategy_targeted"
  | "above_average_ctr";

export type PageBoost = {
  slug:           string;
  reason:         AmplificationReason;
  linkWeightDelta: number;   // +0.1 to +0.5 — how much to increase internal link weight
  seoPriorityDelta: number;  // +0.05 to +0.20 — relative priority increase
};

export type MarketingDecision = {
  boostedPages:    PageBoost[];
  suppressedPages: string[];   // slugs to reduce link weight for
  reason:          string;
};

export type MarketingInput = {
  trafficSignals: TrafficSignal[];
  strategies:     Strategy[];
  /** Min CTR to qualify as high-performing. Default: 0.08 */
  highCTRThreshold?: number;
  /** Max pages to boost per cycle. Default: 5 */
  maxBoosts?: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_HIGH_CTR  = 0.08;
const DEFAULT_MAX_BOOSTS = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ctr(s: TrafficSignal): number {
  return s.pageViews > 0 ? s.affiliateClicks / s.pageViews : 0;
}

function avgCTR(signals: TrafficSignal[]): number {
  if (signals.length === 0) return 0;
  return signals.reduce((sum, s) => sum + ctr(s), 0) / signals.length;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Produce a marketing decision — which pages to boost, which to suppress, and why.
 */
export function runMarketingEngine(input: MarketingInput): MarketingDecision {
  const highCTRThreshold = input.highCTRThreshold ?? DEFAULT_HIGH_CTR;
  const maxBoosts        = input.maxBoosts        ?? DEFAULT_MAX_BOOSTS;
  const avg              = avgCTR(input.trafficSignals);

  const strategyTargets = new Set(
    input.strategies
      .filter((s) => s.action === "boost_landing_page")
      .map((s) => s.target)
  );

  const boostCandidates: PageBoost[] = [];

  for (const signal of input.trafficSignals) {
    const pageCTR = ctr(signal);

    if (strategyTargets.has(signal.slug)) {
      boostCandidates.push({
        slug:              signal.slug,
        reason:            "strategy_targeted",
        linkWeightDelta:   0.4,
        seoPriorityDelta:  0.15,
      });
      continue;
    }

    if (signal.conversionRate >= 0.05 && pageCTR >= highCTRThreshold) {
      boostCandidates.push({
        slug:              signal.slug,
        reason:            "high_conversion_high_intent",
        linkWeightDelta:   0.5,
        seoPriorityDelta:  0.20,
      });
      continue;
    }

    if (signal.pageViews >= 100 && pageCTR < highCTRThreshold * 0.5) {
      // High traffic but CTR is very low — worth recovering
      boostCandidates.push({
        slug:              signal.slug,
        reason:            "high_traffic_low_ctr_recovery",
        linkWeightDelta:   0.3,
        seoPriorityDelta:  0.10,
      });
      continue;
    }

    if (pageCTR > avg * 1.25 && signal.pageViews >= 20) {
      boostCandidates.push({
        slug:              signal.slug,
        reason:            "above_average_ctr",
        linkWeightDelta:   0.2,
        seoPriorityDelta:  0.08,
      });
    }
  }

  // Sort: strategy_targeted first, then by linkWeightDelta
  boostCandidates.sort((a, b) => {
    if (a.reason === "strategy_targeted" && b.reason !== "strategy_targeted") return -1;
    if (b.reason === "strategy_targeted" && a.reason !== "strategy_targeted") return 1;
    return b.linkWeightDelta - a.linkWeightDelta;
  });

  const boostedPages = boostCandidates.slice(0, maxBoosts);
  const boostedSlugs = new Set(boostedPages.map((p) => p.slug));

  // Suppress pages with very low CTR and low views (not worth amplifying)
  const suppressedPages = input.trafficSignals
    .filter((s) => ctr(s) < avg * 0.3 && s.pageViews < 30 && !boostedSlugs.has(s.slug))
    .map((s) => s.slug);

  const reasons: string[] = [];
  if (boostedPages.length > 0) {
    reasons.push(`${boostedPages.length} page(s) boosted: ${boostedPages.map((p) => p.reason).join(", ")}`);
  }
  if (suppressedPages.length > 0) {
    reasons.push(`${suppressedPages.length} page(s) suppressed (low signal)`);
  }

  return {
    boostedPages,
    suppressedPages,
    reason: reasons.length > 0 ? reasons.join("; ") : "no marketing action required",
  };
}

/**
 * Apply page boost deltas to an existing link weight map.
 * Returns a new map — does not mutate input.
 */
export function applyBoostsToLinkWeights(
  currentWeights: Record<string, number>,
  boosts:         PageBoost[]
): Record<string, number> {
  const updated = { ...currentWeights };
  for (const boost of boosts) {
    const current  = updated[boost.slug] ?? 1.0;
    updated[boost.slug] = Math.min(2.0, Math.round((current + boost.linkWeightDelta) * 100) / 100);
  }
  return updated;
}
