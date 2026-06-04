/**
 * V16 Observability — Learning Signal Store
 *
 * Collects and indexes session-level user signals (views, clicks, affiliate clicks)
 * for consumption by the observability pipeline and future learning loops.
 *
 * Server-safe: no localStorage access. Client-side persistence is handled
 * separately by lib/session/sessionMemory.ts. This store is in-memory only
 * and resets on process restart.
 *
 * Signals are keyed by sessionId + productId to deduplicate views.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignalType = "view" | "click" | "affiliate_click";

export interface LearningSignal {
  sessionId:  string;
  productId:  string;
  category:   string;
  type:       SignalType;
  timestamp:  number;
  rank?:      number;        // position at time of signal
}

export interface ProductSignalSummary {
  productId:          string;
  viewCount:          number;
  clickCount:         number;
  affiliateClickCount: number;
  ctr:                number;  // clicks / views
  conversionRate:     number;  // affiliate_clicks / views
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const _signals: LearningSignal[] = [];
const MAX_SIGNALS = 2000;

// ─── Public API ───────────────────────────────────────────────────────────────

export function recordSignal(signal: LearningSignal): void {
  _signals.push(signal);
  if (_signals.length > MAX_SIGNALS) _signals.shift();
}

export function getSignals(category?: string): LearningSignal[] {
  if (!category) return [..._signals];
  return _signals.filter((s) => s.category === category);
}

/**
 * Aggregate signals per product for a given category.
 * Returns sorted by affiliate click count descending.
 */
export function getProductSummaries(category: string): ProductSignalSummary[] {
  const signals = getSignals(category);
  const map     = new Map<string, { views: number; clicks: number; affiliateClicks: number }>();

  for (const signal of signals) {
    const entry = map.get(signal.productId) ?? { views: 0, clicks: 0, affiliateClicks: 0 };
    if (signal.type === "view")            entry.views           += 1;
    if (signal.type === "click")           entry.clicks          += 1;
    if (signal.type === "affiliate_click") entry.affiliateClicks += 1;
    map.set(signal.productId, entry);
  }

  return Array.from(map.entries())
    .map(([productId, counts]): ProductSignalSummary => ({
      productId,
      viewCount:           counts.views,
      clickCount:          counts.clicks,
      affiliateClickCount: counts.affiliateClicks,
      ctr:         counts.views > 0 ? counts.clicks          / counts.views : 0,
      conversionRate: counts.views > 0 ? counts.affiliateClicks / counts.views : 0,
    }))
    .sort((a, b) => b.affiliateClickCount - a.affiliateClickCount);
}

export function clearSignals(): void {
  _signals.length = 0;
}

export function getSignalCount(): number {
  return _signals.length;
}
