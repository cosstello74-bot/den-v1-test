/**
 * v5 Performance Tracker.
 *
 * Tracks per-variant performance metrics within and across sessions.
 * All state lives in localStorage — SSR-safe (guards on typeof window).
 *
 * Metrics tracked per variant:
 *   - pageViews:         Number of times this variant was shown
 *   - productClicks:     Number of product card clicks
 *   - affiliateClicks:   Number of affiliate link clicks
 *   - quizCompletions:   Number of quiz completions attributed to this variant
 *   - estimatedRevenue:  Cumulative simulated revenue (from revenueSimulator)
 *
 * localStorage key: den_v5_perf
 */

import type { VariantId } from "./variantEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VariantMetrics = {
  pageViews:        number;
  productClicks:    number;
  affiliateClicks:  number;
  quizCompletions:  number;
  estimatedRevenue: number;
};

export type PerformanceStore = Record<VariantId, VariantMetrics>;

export type MetricKey = keyof Omit<VariantMetrics, "estimatedRevenue">;

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "den_v5_perf";

const EMPTY_METRICS: VariantMetrics = {
  pageViews:        0,
  productClicks:    0,
  affiliateClicks:  0,
  quizCompletions:  0,
  estimatedRevenue: 0,
};

// ─── Storage helpers ──────────────────────────────────────────────────────────

function emptyStore(): PerformanceStore {
  return { A: { ...EMPTY_METRICS }, B: { ...EMPTY_METRICS }, C: { ...EMPTY_METRICS }, D: { ...EMPTY_METRICS } };
}

export function loadPerformanceStore(): PerformanceStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as PerformanceStore;
    // Fill any missing keys with zero metrics
    const store = emptyStore();
    for (const id of ["A", "B", "C", "D"] as VariantId[]) {
      if (parsed[id]) store[id] = { ...EMPTY_METRICS, ...parsed[id] };
    }
    return store;
  } catch {
    return emptyStore();
  }
}

export function savePerformanceStore(store: PerformanceStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded — silent fail
  }
}

export function clearPerformanceStore(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Mutation helpers ─────────────────────────────────────────────────────────

/**
 * Increment a counter metric for a variant. Persists automatically.
 */
export function incrementMetric(variantId: VariantId, metric: MetricKey, delta = 1): void {
  const store = loadPerformanceStore();
  store[variantId][metric] += delta;
  savePerformanceStore(store);
}

/**
 * Add to estimated revenue for a variant. Persists automatically.
 */
export function addEstimatedRevenue(variantId: VariantId, amount: number): void {
  const store = loadPerformanceStore();
  store[variantId].estimatedRevenue = Math.round((store[variantId].estimatedRevenue + amount) * 100) / 100;
  savePerformanceStore(store);
}

/**
 * Record a page view for a variant.
 */
export function trackPageView(variantId: VariantId): void {
  incrementMetric(variantId, "pageViews");
}

/**
 * Record a product card click for a variant.
 */
export function trackProductClick(variantId: VariantId): void {
  incrementMetric(variantId, "productClicks");
}

/**
 * Record an affiliate link click for a variant.
 */
export function trackAffiliateClick(variantId: VariantId): void {
  incrementMetric(variantId, "affiliateClicks");
}

/**
 * Record a quiz completion for a variant.
 */
export function trackQuizCompletion(variantId: VariantId): void {
  incrementMetric(variantId, "quizCompletions");
}

// ─── Read helpers ─────────────────────────────────────────────────────────────

/**
 * Get metrics for a single variant.
 */
export function getVariantMetrics(variantId: VariantId): VariantMetrics {
  return loadPerformanceStore()[variantId];
}

/**
 * Get all variant metrics.
 */
export function getAllMetrics(): PerformanceStore {
  return loadPerformanceStore();
}

/**
 * Compute affiliate click-through rate for a variant.
 * Returns 0 if no page views.
 */
export function getAffiliateCTR(variantId: VariantId): number {
  const m = getVariantMetrics(variantId);
  if (m.pageViews === 0) return 0;
  return Math.round((m.affiliateClicks / m.pageViews) * 1000) / 1000;
}

/**
 * Return the variant with the highest affiliate CTR.
 * Ties broken by estimated revenue, then alphabetically.
 */
export function getBestPerformingVariant(): VariantId {
  const store = loadPerformanceStore();
  return (["A", "B", "C", "D"] as VariantId[]).sort((a, b) => {
    const ctrDiff = getAffiliateCTR(b) - getAffiliateCTR(a);
    if (ctrDiff !== 0) return ctrDiff;
    return store[b].estimatedRevenue - store[a].estimatedRevenue;
  })[0];
}
