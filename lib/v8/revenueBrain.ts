/**
 * V8 — Revenue Feedback Loop
 * Aggregates real revenue signals and feeds them back into V7 node scoring.
 * Boosts high-performing niches; decays low-performing ones.
 * Designed to be stable — changes are bounded to prevent oscillation.
 */

import type { PageMetrics } from "@/lib/v2/types";
import type { DenNode }     from "@/lib/v7/ecosystemOrchestrator";
import type { NodeBlueprint } from "@/lib/v7/nodeGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NichePerformance = {
  niche:        string;
  totalRevenue: number;
  avgDwell:     number;
  avgBounce:    number;
  conversions:  number;
  signal:       "boost" | "neutral" | "decay";
};

export type FeedbackAdjustment = {
  nodeId:      string;
  niche:       string;
  original:    number;   // original conversionRate
  adjusted:    number;   // feedback-adjusted score
  delta:       number;   // how much it moved
};

// ─── Config ───────────────────────────────────────────────────────────────────

const BOOST_REVENUE_THRESHOLD   = 50;   // £ total revenue → boost signal
const DECAY_REVENUE_THRESHOLD   = 5;    // £ total revenue → decay signal
const BOOST_DWELL_THRESHOLD     = 45;   // seconds
const BOUNCE_DECAY_THRESHOLD    = 0.7;  // 70% bounce rate → decay
const MAX_BOOST_DELTA           = 0.15; // max +0.15 per cycle
const MAX_DECAY_DELTA           = 0.10; // max -0.10 per cycle

// ─── Revenue aggregation ─────────────────────────────────────────────────────

export function aggregateByNiche(
  metrics: PageMetrics[],
  nodes:   DenNode[]
): NichePerformance[] {
  return nodes.map((node) => {
    // Match metrics by slug containing niche keywords
    const nicheSlug = node.niche.toLowerCase().replace(/\s+/g, "-");
    const related   = metrics.filter(
      (m) => m.slug.includes(nicheSlug) || nicheSlug.includes(m.slug)
    );

    const totalRevenue = related.reduce((s, m) => s + m.revenue,     0);
    const totalDwell   = related.reduce((s, m) => s + m.dwellTime,   0);
    const totalBounce  = related.reduce((s, m) => s + m.bounceRate,  0);
    const conversions  = related.reduce((s, m) => s + m.conversions, 0);

    const count    = related.length || 1;
    const avgDwell  = totalDwell  / count;
    const avgBounce = totalBounce / count;

    let signal: NichePerformance["signal"] = "neutral";

    if (totalRevenue >= BOOST_REVENUE_THRESHOLD && avgDwell >= BOOST_DWELL_THRESHOLD) {
      signal = "boost";
    } else if (totalRevenue <= DECAY_REVENUE_THRESHOLD || avgBounce >= BOUNCE_DECAY_THRESHOLD) {
      signal = "decay";
    }

    return { niche: node.niche, totalRevenue, avgDwell, avgBounce, conversions, signal };
  });
}

// ─── Confidence adjustment ────────────────────────────────────────────────────

export function applyFeedback(
  nodes:       DenNode[],
  performance: NichePerformance[]
): FeedbackAdjustment[] {
  const perfMap = new Map(performance.map((p) => [p.niche.toLowerCase(), p]));

  return nodes.map((node) => {
    const perf     = perfMap.get(node.niche.toLowerCase());
    const original = node.conversionRate;

    if (!perf || perf.signal === "neutral") {
      return { nodeId: node.nodeId, niche: node.niche, original, adjusted: original, delta: 0 };
    }

    // Revenue-proportional boost, capped
    const rawBoost = perf.signal === "boost"
      ? Math.min((perf.totalRevenue / 500) * MAX_BOOST_DELTA, MAX_BOOST_DELTA)
      : -Math.min((1 - perf.totalRevenue / DECAY_REVENUE_THRESHOLD) * MAX_DECAY_DELTA, MAX_DECAY_DELTA);

    const adjusted = Math.max(0, Math.min(1, original + rawBoost));
    const delta    = adjusted - original;

    return { nodeId: node.nodeId, niche: node.niche, original, adjusted, delta };
  });
}

// ─── Blueprint confidence enrichment ─────────────────────────────────────────
// Use before passing blueprints to v7 generateCandidateNodes

export function enrichBlueprintsWithRevenue(
  blueprints:  NodeBlueprint[],
  performance: NichePerformance[]
): NodeBlueprint[] {
  const perfMap = new Map(performance.map((p) => [p.niche.toLowerCase(), p]));

  return blueprints.map((bp) => {
    const perf = perfMap.get(bp.niche.toLowerCase());
    if (!perf) return bp;

    const delta =
      perf.signal === "boost" ? Math.min(perf.totalRevenue / 1000, 0.10) :
      perf.signal === "decay" ? -0.05 :
      0;

    return {
      ...bp,
      confidence: Math.max(0, Math.min(1, bp.confidence + delta)),
    };
  });
}

// ─── Niche suppression list ───────────────────────────────────────────────────

export function getSuppressedNiches(performance: NichePerformance[]): Set<string> {
  return new Set(
    performance
      .filter((p) => p.signal === "decay" && p.totalRevenue < DECAY_REVENUE_THRESHOLD)
      .map((p) => p.niche.toLowerCase())
  );
}
