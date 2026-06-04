/**
 * V17 Dashboard — Aggregator
 *
 * NON-NEGOTIABLE per spec. Produces a unified snapshot covering:
 *
 *   1. Ranking drift         — V15 vs V16 difference %
 *   2. Category health       — impressions / CTR / conversion per category
 *   3. Revenue influence     — correlation score (must stay near 0)
 *   4. Guardrail violations  — count per day
 *   5. Rollout state         — current stage + percent
 *   6. Cohort comparison     — per-category V15 vs V16 deltas
 *
 * Call getDashboardSnapshot() to get the full picture in one call.
 * Suitable for admin UI, logging pipelines, or monitoring alerts.
 */

import type { CategoryKey }        from "@/types/product";
import { getRolloutState }         from "../rollout/rolloutController";
import { compareCohorts }          from "../metrics/cohortMetrics";
import { getTiebreakLog }          from "../../v16/observability/revenueAudit";
import { getEvents }               from "../../v16/observability/eventCollector";
import { getProductSummaries }     from "../../v16/observability/learningSignalStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryHealthEntry {
  category:          string;
  impressions:       number;
  ctr:               number;
  conversionRate:    number;
  topProductIds:     string[];
}

export interface RevenueInfluenceAudit {
  tiebreakCount:        number;
  tiebreakRate:         number;    // tiebreaks / total ranking events
  correlationScore:     number;    // 0 = neutral (ideal), 1 = fully correlated
  status:               "clean" | "warning" | "critical";
}

export interface GuardrailHealth {
  violationsToday:      number;
  violationsTotal:      number;
  lastViolationAt?:     number;
}

export interface DashboardSnapshot {
  timestamp:            number;
  rollout:              ReturnType<typeof getRolloutState>;
  rankingDivergence: {
    [category: string]: {
      ctrDelta:     number;
      revenueDelta: number;
      dwellDelta:   number;
    };
  };
  categoryHealth:       CategoryHealthEntry[];
  revenueAudit:         RevenueInfluenceAudit;
  guardrails:           GuardrailHealth;
  overall: {
    status:             "healthy" | "degraded" | "critical";
    flags:              string[];
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES: CategoryKey[] = ["laptops", "phones", "monitors", "tablets", "pcs"];

function buildCategoryHealth(): CategoryHealthEntry[] {
  return CATEGORIES.map((cat) => {
    const summaries = getProductSummaries(cat);
    const totalViews  = summaries.reduce((s, p) => s + p.viewCount,          0);
    const totalClicks = summaries.reduce((s, p) => s + p.clickCount,         0);
    const totalAffs   = summaries.reduce((s, p) => s + p.affiliateClickCount, 0);

    return {
      category:       cat,
      impressions:    totalViews,
      ctr:            totalViews > 0 ? totalClicks / totalViews : 0,
      conversionRate: totalViews > 0 ? totalAffs   / totalViews : 0,
      topProductIds:  summaries.slice(0, 3).map((p) => p.productId),
    };
  });
}

function buildRevenueAudit(): RevenueInfluenceAudit {
  const tiebreakLog    = getTiebreakLog();
  const rankingEvents  = getEvents("ranking_produced").length || 1;
  const tiebreakCount  = tiebreakLog.length;
  const tiebreakRate   = tiebreakCount / rankingEvents;

  // Correlation score: how often high-revenue products appear in top-3.
  // Computed from tiebreak rate + revenue efficiency in top positions.
  // 0 = revenue has no influence; 1 = fully correlated.
  // Simple proxy: tiebreak rate scaled to 0-1 (capped at 0.5 = warning).
  const correlationScore = Math.min(tiebreakRate * 2, 1.0);

  const status: RevenueInfluenceAudit["status"] =
    correlationScore > 0.5 ? "critical" :
    correlationScore > 0.2 ? "warning"  : "clean";

  return { tiebreakCount, tiebreakRate, correlationScore, status };
}

function buildGuardrailHealth(): GuardrailHealth {
  const violations   = getEvents("guardrail_violation");
  const oneDayAgo    = Date.now() - 24 * 60 * 60 * 1000;
  const todayCount   = violations.filter((e) => e.timestamp > oneDayAgo).length;
  const lastEvent    = violations[violations.length - 1];

  return {
    violationsToday: todayCount,
    violationsTotal: violations.length,
    lastViolationAt: lastEvent?.timestamp,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getDashboardSnapshot(): DashboardSnapshot {
  const rollout        = getRolloutState();
  const categoryHealth = buildCategoryHealth();
  const revenueAudit   = buildRevenueAudit();
  const guardrails     = buildGuardrailHealth();

  // Per-category V15 vs V16 divergence
  const rankingDivergence: DashboardSnapshot["rankingDivergence"] = {};
  for (const cat of CATEGORIES) {
    const cmp = compareCohorts(cat);
    rankingDivergence[cat] = {
      ctrDelta:     Math.round(cmp.ctrDelta     * 10000) / 10000,
      revenueDelta: Math.round(cmp.revenueDelta * 10000) / 10000,
      dwellDelta:   Math.round(cmp.dwellDelta   * 10)    / 10,
    };
  }

  // Overall status flags
  const flags: string[] = [];
  if (revenueAudit.status === "critical")   flags.push("REVENUE_CORRELATION_CRITICAL");
  if (revenueAudit.status === "warning")    flags.push("REVENUE_CORRELATION_WARNING");
  if (guardrails.violationsToday > 0)       flags.push(`GUARDRAIL_VIOLATIONS:${guardrails.violationsToday}`);

  for (const cat of CATEGORIES) {
    const health = categoryHealth.find((h) => h.category === cat);
    if (health && health.impressions === 0) flags.push(`CATEGORY_ZERO_IMPRESSIONS:${cat}`);
  }

  const overallStatus: DashboardSnapshot["overall"]["status"] =
    flags.some((f) => f.includes("CRITICAL")) ? "critical" :
    flags.length > 0                           ? "degraded" : "healthy";

  return {
    timestamp: Date.now(),
    rollout,
    rankingDivergence,
    categoryHealth,
    revenueAudit,
    guardrails,
    overall: { status: overallStatus, flags },
  };
}
