/**
 * v7 Cross-Node Intelligence Network.
 *
 * Aggregates and shares learnings across all ecosystem nodes.
 * Each node can publish signals; all nodes can read the shared pool.
 *
 * Shared data pools:
 *   - High-converting intents
 *   - Best landing page formats
 *   - Top revenue categories
 *   - Failed strategies (suppression list)
 *
 * localStorage key: den_v7_intel_network
 * SSR-safe.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SharedIntent = {
  key:           string;
  sourceNodeId:  string;
  conversionRate: number;
  frequency:     number;
  confidence:    number;
  publishedAt:   number;
};

export type SharedPageFormat = {
  formatId:      string;       // e.g. "comparison_table_top5"
  sourceNodeId:  string;
  avgCTR:        number;
  avgConvRate:   number;
  sampleSlugs:   string[];
  publishedAt:   number;
};

export type SharedRevenueCategory = {
  category:      string;
  sourceNodeId:  string;
  avgRevenue:    number;
  peakRevenue:   number;
  observedCount: number;
  publishedAt:   number;
};

export type FailedStrategySignal = {
  strategyName:  string;
  sourceNodeId:  string;
  failReason:    string;
  observedLoss:  number;    // revenue delta (negative)
  publishedAt:   number;
};

export type IntelligencePool = {
  highConvertingIntents:  SharedIntent[];
  bestPageFormats:        SharedPageFormat[];
  topRevenueCategories:   SharedRevenueCategory[];
  failedStrategies:       FailedStrategySignal[];
  lastUpdated:            number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY       = "den_v7_intel_network";
const MAX_INTENTS       = 50;
const MAX_FORMATS       = 20;
const MAX_CATEGORIES    = 30;
const MAX_FAILED        = 40;

// ─── Known page formats ───────────────────────────────────────────────────────

/** Seeded page format templates (not real pages — simulated format descriptors). */
export const KNOWN_PAGE_FORMATS: Omit<SharedPageFormat, "sourceNodeId" | "publishedAt">[] = [
  { formatId: "comparison_table_top5", avgCTR: 0.12, avgConvRate: 0.04, sampleSlugs: ["best-gaming-laptops-under-1000"] },
  { formatId: "buyer_guide_long",      avgCTR: 0.09, avgConvRate: 0.03, sampleSlugs: ["best-laptops-for-students"] },
  { formatId: "quick_picks_3",         avgCTR: 0.15, avgConvRate: 0.05, sampleSlugs: ["best-budget-laptops"] },
  { formatId: "vs_comparison",         avgCTR: 0.11, avgConvRate: 0.035, sampleSlugs: ["laptops-for-coding"] },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function emptyPool(): IntelligencePool {
  return {
    highConvertingIntents: [],
    bestPageFormats:       [],
    topRevenueCategories:  [],
    failedStrategies:      [],
    lastUpdated:           0,
  };
}

export function loadIntelligencePool(): IntelligencePool {
  if (typeof window === "undefined") return emptyPool();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPool();
    return { ...emptyPool(), ...(JSON.parse(raw) as IntelligencePool) };
  } catch {
    return emptyPool();
  }
}

export function saveIntelligencePool(pool: IntelligencePool): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...pool, lastUpdated: Date.now() }));
  } catch {
    // quota exceeded — silent fail
  }
}

export function clearIntelligencePool(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Publish helpers ──────────────────────────────────────────────────────────

export function publishIntent(
  nodeId:         string,
  key:            string,
  conversionRate: number,
  frequency:      number,
  confidence:     number
): void {
  const pool = loadIntelligencePool();
  const existing = pool.highConvertingIntents.find((i) => i.key === key);
  if (existing) {
    existing.conversionRate = Math.max(existing.conversionRate, conversionRate);
    existing.frequency     += frequency;
    existing.publishedAt    = Date.now();
  } else {
    pool.highConvertingIntents.push({ key, sourceNodeId: nodeId, conversionRate, frequency, confidence, publishedAt: Date.now() });
    if (pool.highConvertingIntents.length > MAX_INTENTS) {
      pool.highConvertingIntents.sort((a, b) => b.conversionRate - a.conversionRate);
      pool.highConvertingIntents.splice(MAX_INTENTS);
    }
  }
  saveIntelligencePool(pool);
}

export function publishRevenueCategory(
  nodeId:    string,
  category:  string,
  revenue:   number,
  count:     number
): void {
  const pool = loadIntelligencePool();
  const existing = pool.topRevenueCategories.find((c) => c.category === category);
  if (existing) {
    existing.avgRevenue    = (existing.avgRevenue * existing.observedCount + revenue) / (existing.observedCount + count);
    existing.peakRevenue   = Math.max(existing.peakRevenue, revenue);
    existing.observedCount += count;
  } else {
    pool.topRevenueCategories.push({ category, sourceNodeId: nodeId, avgRevenue: revenue, peakRevenue: revenue, observedCount: count, publishedAt: Date.now() });
    if (pool.topRevenueCategories.length > MAX_CATEGORIES) {
      pool.topRevenueCategories.sort((a, b) => b.avgRevenue - a.avgRevenue);
      pool.topRevenueCategories.splice(MAX_CATEGORIES);
    }
  }
  saveIntelligencePool(pool);
}

export function publishFailedStrategy(
  nodeId:       string,
  strategyName: string,
  failReason:   string,
  observedLoss: number
): void {
  const pool = loadIntelligencePool();
  if (!pool.failedStrategies.find((f) => f.strategyName === strategyName && f.sourceNodeId === nodeId)) {
    pool.failedStrategies.push({ strategyName, sourceNodeId: nodeId, failReason, observedLoss, publishedAt: Date.now() });
    if (pool.failedStrategies.length > MAX_FAILED) {
      pool.failedStrategies.sort((a, b) => a.observedLoss - b.observedLoss);
      pool.failedStrategies.splice(MAX_FAILED);
    }
    saveIntelligencePool(pool);
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export function getTopIntents(limit = 10): SharedIntent[] {
  return loadIntelligencePool()
    .highConvertingIntents
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, limit);
}

export function getTopRevenueCategories(limit = 10): SharedRevenueCategory[] {
  return loadIntelligencePool()
    .topRevenueCategories
    .sort((a, b) => b.avgRevenue - a.avgRevenue)
    .slice(0, limit);
}

export function isStrategyBlacklisted(strategyName: string): boolean {
  return loadIntelligencePool().failedStrategies.some((f) => f.strategyName === strategyName);
}

/**
 * Seed the intelligence pool with known page formats for all nodes.
 * Idempotent — only adds formats not already present.
 */
export function seedPageFormats(nodeId: string): void {
  const pool = loadIntelligencePool();
  const existingIds = new Set(pool.bestPageFormats.map((f) => f.formatId));
  const toAdd = KNOWN_PAGE_FORMATS.filter((f) => !existingIds.has(f.formatId));
  if (toAdd.length === 0) return;
  for (const f of toAdd) {
    pool.bestPageFormats.push({ ...f, sourceNodeId: nodeId, publishedAt: Date.now() });
  }
  if (pool.bestPageFormats.length > MAX_FORMATS) pool.bestPageFormats.splice(MAX_FORMATS);
  saveIntelligencePool(pool);
}
