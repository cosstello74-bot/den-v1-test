/**
 * v2 Lite Analytics — localStorage-only product + funnel tracking.
 *
 * Tracks without a server:
 *   - CTR per product (impressions / clicks / affiliate clicks)
 *   - Quiz funnel completion rate
 *   - Affiliate click rate
 *
 * Provides getBehaviorProfile() for the learning engine.
 * All data stored under "den_analytics_v2" in localStorage.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductMetrics {
  productId:       string;
  impressions:     number;
  clicks:          number;
  affiliateClicks: number;
  ctr:             number;        // clicks / impressions × 100
  affiliateCtr:    number;        // affiliateClicks / impressions × 100
  lastSeen:        number;        // Unix ms
}

export interface FunnelMetrics {
  quizStarts:      number;
  quizCompletions: number;
  resultViews:     number;
  completionRate:  number;        // quizCompletions / quizStarts × 100
  affiliateClicks: number;
}

export interface AnalyticsStore {
  products:  Record<string, ProductMetrics>;
  funnel:    FunnelMetrics;
  updatedAt: number;
}

export interface BehaviorProfile {
  /** Product with highest affiliate CTR in this session. */
  topProductId:       string | null;
  /** Products with affiliate CTR > 5% — strong buy signal. */
  highAffiliateCtr:   string[];
  /** Products with 3+ impressions and < 1% CTR — implicit rejection. */
  lowPerformers:      string[];
  /** Quiz completion rate 0–100. */
  quizCompletionRate: number;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const KEY = "den_analytics_v2";

function isClient(): boolean {
  return typeof window !== "undefined";
}

function emptyStore(): AnalyticsStore {
  return {
    products:  {},
    funnel: { quizStarts: 0, quizCompletions: 0, resultViews: 0, completionRate: 0, affiliateClicks: 0 },
    updatedAt: Date.now(),
  };
}

function load(): AnalyticsStore {
  if (!isClient()) return emptyStore();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnalyticsStore) : emptyStore();
  } catch {
    return emptyStore();
  }
}

function save(store: AnalyticsStore): void {
  if (!isClient()) return;
  try {
    store.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch { /* quota */ }
}

function getOrCreate(store: AnalyticsStore, productId: string): ProductMetrics {
  if (!store.products[productId]) {
    store.products[productId] = {
      productId, impressions: 0, clicks: 0, affiliateClicks: 0, ctr: 0, affiliateCtr: 0, lastSeen: Date.now(),
    };
  }
  return store.products[productId];
}

function recalcCtr(p: ProductMetrics): void {
  p.ctr          = p.impressions > 0 ? Math.round((p.clicks / p.impressions)          * 1000) / 10 : 0;
  p.affiliateCtr = p.impressions > 0 ? Math.round((p.affiliateClicks / p.impressions) * 1000) / 10 : 0;
}

// ─── Tracking API ─────────────────────────────────────────────────────────────

export function trackImpression(productId: string): void {
  const store = load();
  const p     = getOrCreate(store, productId);
  p.impressions++;
  p.lastSeen = Date.now();
  recalcCtr(p);
  save(store);
}

export function trackClick(productId: string): void {
  const store = load();
  const p     = getOrCreate(store, productId);
  p.clicks++;
  recalcCtr(p);
  save(store);
}

export function trackAffiliateClick(productId: string): void {
  const store = load();
  const p     = getOrCreate(store, productId);
  p.affiliateClicks++;
  store.funnel.affiliateClicks++;
  recalcCtr(p);
  save(store);
}

export function trackQuizStart(): void {
  const store = load();
  store.funnel.quizStarts++;
  store.funnel.completionRate = store.funnel.quizStarts > 0
    ? Math.round((store.funnel.quizCompletions / store.funnel.quizStarts) * 1000) / 10
    : 0;
  save(store);
}

export function trackQuizCompletion(): void {
  const store = load();
  store.funnel.quizCompletions++;
  store.funnel.completionRate = store.funnel.quizStarts > 0
    ? Math.round((store.funnel.quizCompletions / store.funnel.quizStarts) * 1000) / 10
    : 0;
  save(store);
}

export function trackResultView(): void {
  const store = load();
  store.funnel.resultViews++;
  save(store);
}

// ─── Read API ─────────────────────────────────────────────────────────────────

export function getProductMetrics(productId: string): ProductMetrics | null {
  return load().products[productId] ?? null;
}

export function getAllProductMetrics(): Record<string, ProductMetrics> {
  return load().products;
}

export function getFunnelMetrics(): FunnelMetrics {
  return load().funnel;
}

// ─── Behavior profile ─────────────────────────────────────────────────────────

/**
 * Derive a BehaviorProfile from local analytics data.
 * Fed into adjustmentFromProfile() in the learning engine.
 */
export function getBehaviorProfile(): BehaviorProfile {
  const store    = load();
  const products = Object.values(store.products);

  const sorted      = [...products].sort((a, b) => b.affiliateCtr - a.affiliateCtr);
  const topProduct  = sorted.find((p) => p.affiliateClicks > 0) ?? null;

  return {
    topProductId:       topProduct?.productId ?? null,
    highAffiliateCtr:   products.filter((p) => p.affiliateCtr > 5).map((p) => p.productId),
    lowPerformers:      products.filter((p) => p.impressions >= 3 && p.ctr < 1).map((p) => p.productId),
    quizCompletionRate: store.funnel.completionRate,
  };
}

export function clearAnalytics(): void {
  if (!isClient()) return;
  localStorage.removeItem(KEY);
}
