/**
 * v6 Business Opportunity Detector.
 *
 * Analyses traffic signals, CTR data, revenue inefficiencies, and
 * emerging intents (v4 AEL) to surface actionable business opportunities.
 *
 * Pure function — no I/O. Caller injects all signal data.
 */

import type { VariantId } from "@/lib/v5/variantEngine";
import type { PerformanceStore } from "@/lib/v5/performanceTracker";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpportunityType =
  | "new_product_category"   // high search demand, no coverage
  | "intent_gap"             // observed intent with no matching page
  | "revenue_inefficiency"   // high traffic, low affiliate clicks
  | "conversion_gap"         // high product views, low conversions
  | "category_expansion"     // adjacent category with signal
  | "variant_dominance";     // one variant far outperforms, opportunity to lean in

export type Opportunity = {
  type:        OpportunityType;
  name:        string;
  urgency:     number;           // 0–1, higher = act sooner
  confidence:  number;           // 0–1
  evidence:    string;           // human-readable justification
  meta?:       Record<string, string | number>;
};

export type TrafficSignal = {
  slug:            string;
  pageViews:       number;
  affiliateClicks: number;
  conversionRate:  number;  // 0–1
};

export type IntentSignal = {
  key:        string;
  slug:       string;
  frequency:  number;
  confidence: number;
  hasPage:    boolean;  // false = gap
};

export type OpportunityDetectorInput = {
  trafficSignals:    TrafficSignal[];
  intentSignals:     IntentSignal[];
  performanceStore:  PerformanceStore;
  /** CTR threshold below which a page is considered underperforming. Default: 0.05 */
  lowCTRThreshold?:  number;
  /** Urgency floor — opportunities below this are suppressed. Default: 0.5 */
  urgencyFloor?:     number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_LOW_CTR   = 0.05;
const DEFAULT_URGENCY_FLOOR = 0.50;

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, v));
}

/** Normalise page views to a 0–1 urgency signal (log scale, saturates at 1000 views). */
function viewsToUrgency(views: number): number {
  return clamp(Math.log10(Math.max(1, views)) / 3);
}

// ─── Detector functions ───────────────────────────────────────────────────────

function detectIntentGaps(signals: IntentSignal[]): Opportunity[] {
  return signals
    .filter((s) => !s.hasPage && s.confidence >= 0.70)
    .map((s) => ({
      type:       "intent_gap" as OpportunityType,
      name:       s.key.replace(/-/g, " "),
      urgency:    clamp(s.confidence * 0.6 + (s.frequency > 0 ? 0.3 : 0.1)),
      confidence: s.confidence,
      evidence:   `intent "${s.key}" has ${s.frequency} signals but no dedicated page`,
      meta:       { frequency: s.frequency, slug: s.slug },
    }));
}

function detectRevenueInefficiencies(signals: TrafficSignal[], lowCTR: number): Opportunity[] {
  return signals
    .filter((s) => s.pageViews >= 50 && s.affiliateClicks / Math.max(s.pageViews, 1) < lowCTR)
    .map((s) => {
      const actualCTR = s.affiliateClicks / Math.max(s.pageViews, 1);
      const gap       = lowCTR - actualCTR;
      return {
        type:       "revenue_inefficiency" as OpportunityType,
        name:       s.slug.replace(/-/g, " "),
        urgency:    clamp(viewsToUrgency(s.pageViews) * 0.7 + gap * 2),
        confidence: 0.80,
        evidence:   `page "${s.slug}" has ${s.pageViews} views but only ${(actualCTR * 100).toFixed(1)}% affiliate CTR (threshold: ${(lowCTR * 100).toFixed(0)}%)`,
        meta:       { pageViews: s.pageViews, affiliateCTR: Math.round(actualCTR * 1000) / 1000 },
      };
    });
}

function detectConversionGaps(signals: TrafficSignal[]): Opportunity[] {
  const avgConv = signals.reduce((s, t) => s + t.conversionRate, 0) / Math.max(signals.length, 1);
  return signals
    .filter((s) => s.pageViews >= 30 && s.conversionRate < avgConv * 0.5)
    .map((s) => ({
      type:       "conversion_gap" as OpportunityType,
      name:       s.slug.replace(/-/g, " "),
      urgency:    clamp(viewsToUrgency(s.pageViews) * 0.65),
      confidence: 0.75,
      evidence:   `"${s.slug}" conversion rate ${(s.conversionRate * 100).toFixed(1)}% is below half the avg ${(avgConv * 100).toFixed(1)}%`,
      meta:       { conversionRate: s.conversionRate, avgConvRate: Math.round(avgConv * 1000) / 1000 },
    }));
}

function detectVariantDominance(store: PerformanceStore): Opportunity[] {
  const variants = ["A", "B", "C", "D"] as VariantId[];
  const ctrs = variants.map((id) => {
    const m   = store[id];
    const ctr = m.pageViews > 0 ? m.affiliateClicks / m.pageViews : 0;
    return { id, ctr, revenue: m.estimatedRevenue, pageViews: m.pageViews };
  });

  const totalViews = ctrs.reduce((s, v) => s + v.pageViews, 0);
  if (totalViews < 20) return [];

  ctrs.sort((a, b) => b.ctr - a.ctr);
  const best  = ctrs[0];
  const worst = ctrs[ctrs.length - 1];

  if (best.ctr < 0.01 || best.ctr <= worst.ctr * 1.5) return [];

  return [{
    type:       "variant_dominance",
    name:       `variant ${best.id} outperforms others`,
    urgency:    clamp(best.ctr * 5),
    confidence: clamp(Math.min(totalViews / 100, 1) * 0.9),
    evidence:   `variant ${best.id} CTR ${(best.ctr * 100).toFixed(1)}% vs worst ${best.id !== worst.id ? worst.id : ""} ${(worst.ctr * 100).toFixed(1)}%`,
    meta:       { bestVariant: best.id, bestCTR: Math.round(best.ctr * 1000) / 1000 },
  }];
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Detect all current business opportunities from available signals.
 * Returns opportunities sorted by urgency descending.
 */
export function detectOpportunities(input: OpportunityDetectorInput): Opportunity[] {
  const lowCTR       = input.lowCTRThreshold  ?? DEFAULT_LOW_CTR;
  const urgencyFloor = input.urgencyFloor     ?? DEFAULT_URGENCY_FLOOR;

  const all: Opportunity[] = [
    ...detectIntentGaps(input.intentSignals),
    ...detectRevenueInefficiencies(input.trafficSignals, lowCTR),
    ...detectConversionGaps(input.trafficSignals),
    ...detectVariantDominance(input.performanceStore),
  ];

  return all
    .filter((o) => o.urgency >= urgencyFloor)
    .sort((a, b) => b.urgency - a.urgency);
}

/**
 * Summarise opportunities by type for dashboard display.
 */
export function summariseOpportunities(opportunities: Opportunity[]): Record<OpportunityType, number> {
  const counts: Record<OpportunityType, number> = {
    new_product_category: 0,
    intent_gap:           0,
    revenue_inefficiency: 0,
    conversion_gap:       0,
    category_expansion:   0,
    variant_dominance:    0,
  };
  for (const o of opportunities) counts[o.type]++;
  return counts;
}
