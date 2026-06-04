/**
 * V9 — SEO Self-Optimisation Layer
 * Scores pages on CTR, dwell time, and revenue.
 * Classifies pages into: boost, neutral, or prune.
 * Pruning is non-destructive — pages are flagged, not deleted.
 */

import type { PageMetrics } from "@/lib/v2/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageStatus = "boost" | "neutral" | "prune";

export type ScoredPage = {
  slug:         string;
  ctr:          number;   // clicks / impressions
  dwellTime:    number;
  bounceRate:   number;
  revenue:      number;
  compositeScore: number;
  status:       PageStatus;
};

export type OptimisationReport = {
  generatedAt: number;
  totalPages:  number;
  boostCount:  number;
  neutralCount: number;
  pruneCount:  number;
  pages:       ScoredPage[];
};

// ─── Scoring config ───────────────────────────────────────────────────────────

const WEIGHTS = {
  ctr:      30,   // max 30 pts (ctr 0–1 scaled to 0–30)
  dwell:    25,   // max 25 pts (120s = full score)
  revenue:  35,   // max 35 pts (£100 = full score)
  bounce:   10,   // max 10 pts penalty from bounce rate
};

const BOOST_THRESHOLD = 65;
const PRUNE_THRESHOLD = 30;
const MIN_IMPRESSIONS = 10;  // ignore pages with < 10 impressions (too early to judge)

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function computeCtr(m: PageMetrics): number {
  if (m.impressions === 0) return 0;
  return m.clicks / m.impressions;
}

export function scorePage(m: PageMetrics): number {
  const ctr = computeCtr(m);

  const ctrPts     = Math.min(ctr * 300, WEIGHTS.ctr);           // ctr 0.1 = 30 pts
  const dwellPts   = Math.min((m.dwellTime / 120) * WEIGHTS.dwell, WEIGHTS.dwell);
  const revPts     = Math.min((m.revenue / 100) * WEIGHTS.revenue, WEIGHTS.revenue);
  const bouncePen  = m.bounceRate * WEIGHTS.bounce;

  return Math.max(0, ctrPts + dwellPts + revPts - bouncePen);
}

// ─── Classify ─────────────────────────────────────────────────────────────────

export function classifyPage(score: number, impressions: number): PageStatus {
  if (impressions < MIN_IMPRESSIONS) return "neutral";   // insufficient data
  if (score >= BOOST_THRESHOLD)      return "boost";
  if (score <= PRUNE_THRESHOLD)      return "prune";
  return "neutral";
}

// ─── Main optimiser ───────────────────────────────────────────────────────────

export function runSeoOptimiser(metrics: PageMetrics[]): OptimisationReport {
  const pages: ScoredPage[] = metrics.map((m) => {
    const ctr            = computeCtr(m);
    const compositeScore = scorePage(m);
    const status         = classifyPage(compositeScore, m.impressions);

    return {
      slug:           m.slug,
      ctr,
      dwellTime:      m.dwellTime,
      bounceRate:     m.bounceRate,
      revenue:        m.revenue,
      compositeScore,
      status,
    };
  });

  return {
    generatedAt:  Date.now(),
    totalPages:   pages.length,
    boostCount:   pages.filter((p) => p.status === "boost").length,
    neutralCount: pages.filter((p) => p.status === "neutral").length,
    pruneCount:   pages.filter((p) => p.status === "prune").length,
    pages,
  };
}

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getBoostCandidates(report: OptimisationReport): ScoredPage[] {
  return report.pages.filter((p) => p.status === "boost");
}

export function getPruneCandidates(report: OptimisationReport): ScoredPage[] {
  return report.pages.filter((p) => p.status === "prune");
}

export function getPruneSet(report: OptimisationReport): Set<string> {
  return new Set(getPruneCandidates(report).map((p) => p.slug));
}
