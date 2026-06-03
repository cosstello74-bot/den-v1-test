/**
 * Phase 6 — Event aggregator.
 *
 * Aggregates raw event streams into structured intelligence metrics:
 *   - per-product CTR (raw + time-weighted)
 *   - conversion proxy (affiliate_clicked / product_viewed)
 *   - funnel drop-off rates
 *   - session-level engagement metrics
 *
 * These metrics feed directly into the learning loop and truth calibration.
 */

import type { Event, EventType, SegmentType } from "@/types/event";
import { applyDecay } from "@/lib/timeDecay";

// ─── Output types ─────────────────────────────────────────────────────────────

export type ProductAggregation = {
  productId:            string;
  impressions:          number;
  clicks:               number;
  affiliateClicks:      number;
  rawCtr:               number;   // clicks / impressions × 100
  affiliateCtr:         number;   // affiliateClicks / impressions × 100
  weightedCtr:          number;   // time-decayed CTR
  conversionProxy:      number;   // affiliateClicks / impressions × 100 (best available proxy)
  returnsCount:         number;
  revisitsCount:        number;
  confirmedConversions: number;
  failedConversions:    number;
  truthSignalStrength:  number;   // 0–1 — how much outcome data exists
  segmentBreakdown:     Record<string, { impressions: number; clicks: number; ctr: number }>;
};

export type FunnelMetrics = {
  pageViews:       number;
  quizStarts:      number;
  quizCompletes:   number;
  resultsViews:    number;
  productViews:    number;
  affiliateClicks: number;
  quizStartRate:   number; // quizStarts / pageViews
  quizCompleteRate: number; // quizCompletes / quizStarts
  resultsViewRate:  number; // resultsViews / quizCompletes
  clickThroughRate: number; // affiliateClicks / productViews
};

export type SessionMetrics = {
  totalSessions:      number;
  avgEventsPerSession: number;
  avgProductsViewed:  number;
  avgTimeOnSite:      number | null; // ms, null if insufficient data
};

export type AggregatedIntelligence = {
  aggregatedAt:   string;
  products:       Record<string, ProductAggregation>;
  funnel:         FunnelMetrics;
  sessions:       SessionMetrics;
  topProductIds:  string[]; // by weighted CTR
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

function countType(events: Event[], type: EventType): number {
  return events.filter((e) => e.type === type).length;
}

function groupBySession(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
  for (const e of events) {
    const bucket = map.get(e.sessionId) ?? [];
    bucket.push(e);
    map.set(e.sessionId, bucket);
  }
  return map;
}

// ─── Main aggregator ──────────────────────────────────────────────────────────

export function aggregateEvents(events: Event[]): AggregatedIntelligence {
  const now = Date.now();

  // ── Per-product aggregation ───────────────────────────────────────────────

  const productMap = new Map<string, Event[]>();
  for (const e of events) {
    if (!e.productId) continue;
    const bucket = productMap.get(e.productId) ?? [];
    bucket.push(e);
    productMap.set(e.productId, bucket);
  }

  const products: Record<string, ProductAggregation> = {};

  for (const [pid, pevents] of Array.from(productMap.entries())) {
    const impressionEvents  = pevents.filter((e) => e.type === "product_viewed");
    const clickEvents       = pevents.filter((e) => e.type === "product_clicked");
    const affiliateEvents   = pevents.filter((e) => e.type === "affiliate_clicked");
    const returnEvents      = pevents.filter((e) => e.type === "product_returned");
    const revisitEvents     = pevents.filter((e) => e.type === "product_revisited");
    const confirmEvents     = pevents.filter((e) => e.type === "conversion_confirmed");
    const failEvents        = pevents.filter((e) => e.type === "conversion_failed");

    const impressions    = impressionEvents.length;
    const clicks         = clickEvents.length;
    const affiliateClicks = affiliateEvents.length;

    const rawCtr        = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const affiliateCtr  = impressions > 0 ? (affiliateClicks / impressions) * 100 : 0;

    // Time-weighted CTR
    const wImpr = impressionEvents.reduce((s, e) => s + applyDecay((now - e.timestamp) / 86_400_000), 0);
    const wClick = [...clickEvents, ...affiliateEvents].reduce((s, e) => s + applyDecay((now - e.timestamp) / 86_400_000), 0);
    const weightedCtr = wImpr > 0 ? (wClick / wImpr) * 100 : 0;

    // Conversion proxy — best available signal
    const conversionProxy = affiliateCtr;

    // Truth signal strength: outcome events / (outcome events + impression events)
    const outcomeCount    = returnEvents.length + revisitEvents.length + confirmEvents.length + failEvents.length;
    const truthSignalStrength = (outcomeCount + impressions) > 0
      ? outcomeCount / (outcomeCount + impressions)
      : 0;

    // Segment breakdown
    const segmentBreakdown: Record<string, { impressions: number; clicks: number; ctr: number }> = {};
    const segmentTypes: SegmentType[] = ["student", "gamer", "professional", "creator", "general"];
    for (const seg of segmentTypes) {
      const segImpr  = impressionEvents.filter((e) => e.metadata?.segment === seg).length;
      const segClick = [...clickEvents, ...affiliateEvents].filter((e) => e.metadata?.segment === seg).length;
      if (segImpr > 0 || segClick > 0) {
        segmentBreakdown[seg] = {
          impressions: segImpr,
          clicks:      segClick,
          ctr:         segImpr > 0 ? (segClick / segImpr) * 100 : 0,
        };
      }
    }

    products[pid] = {
      productId:            pid,
      impressions,
      clicks,
      affiliateClicks,
      rawCtr:               Math.round(rawCtr * 100) / 100,
      affiliateCtr:         Math.round(affiliateCtr * 100) / 100,
      weightedCtr:          Math.round(weightedCtr * 100) / 100,
      conversionProxy:      Math.round(conversionProxy * 100) / 100,
      returnsCount:         returnEvents.length,
      revisitsCount:        revisitEvents.length,
      confirmedConversions: confirmEvents.length,
      failedConversions:    failEvents.length,
      truthSignalStrength:  Math.round(truthSignalStrength * 100) / 100,
      segmentBreakdown,
    };
  }

  // ── Funnel metrics ────────────────────────────────────────────────────────

  const pageViews       = countType(events, "page_view");
  const quizStarts      = countType(events, "quiz_started");
  const quizCompletes   = countType(events, "quiz_completed");
  const resultsViews    = countType(events, "results_viewed");
  const productViews    = countType(events, "product_viewed");
  const affiliateClicks = countType(events, "affiliate_clicked");

  const funnel: FunnelMetrics = {
    pageViews,
    quizStarts,
    quizCompletes,
    resultsViews,
    productViews,
    affiliateClicks,
    quizStartRate:    pageViews       > 0 ? Math.round((quizStarts    / pageViews)       * 1000) / 10 : 0,
    quizCompleteRate: quizStarts      > 0 ? Math.round((quizCompletes / quizStarts)      * 1000) / 10 : 0,
    resultsViewRate:  quizCompletes   > 0 ? Math.round((resultsViews  / quizCompletes)   * 1000) / 10 : 0,
    clickThroughRate: productViews    > 0 ? Math.round((affiliateClicks / productViews)  * 1000) / 10 : 0,
  };

  // ── Session metrics ───────────────────────────────────────────────────────

  const sessionMap          = groupBySession(events);
  const totalSessions       = sessionMap.size;
  const allSessionEvents    = Array.from(sessionMap.values());
  const avgEventsPerSession = totalSessions > 0
    ? Math.round(allSessionEvents.reduce((s, se) => s + se.length, 0) / totalSessions)
    : 0;
  const avgProductsViewed   = totalSessions > 0
    ? Math.round(
        allSessionEvents.reduce((s, se) => s + se.filter((e) => e.type === "product_viewed").length, 0)
        / totalSessions * 10
      ) / 10
    : 0;

  // Time on site: difference between first and last event in session
  let totalDuration = 0;
  let durableSessionCount = 0;
  for (const se of allSessionEvents) {
    if (se.length < 2) continue;
    const sorted = se.slice().sort((a, b) => a.timestamp - b.timestamp);
    totalDuration += sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    durableSessionCount++;
  }
  const avgTimeOnSite = durableSessionCount > 0 ? Math.round(totalDuration / durableSessionCount) : null;

  const sessions: SessionMetrics = {
    totalSessions,
    avgEventsPerSession,
    avgProductsViewed,
    avgTimeOnSite,
  };

  // ── Top products by weighted CTR ──────────────────────────────────────────

  const topProductIds = Object.values(products)
    .sort((a, b) => b.weightedCtr - a.weightedCtr)
    .slice(0, 5)
    .map((p) => p.productId);

  return {
    aggregatedAt: new Date().toISOString(),
    products,
    funnel,
    sessions,
    topProductIds,
  };
}

/**
 * Derive a simple conversion proxy rate for a product.
 * Returns affiliate CTR, falls back to click CTR.
 */
export function getConversionProxy(
  productId: string,
  agg:       AggregatedIntelligence
): number {
  const p = agg.products[productId];
  if (!p) return 0;
  return p.affiliateCtr > 0 ? p.affiliateCtr : p.rawCtr;
}
