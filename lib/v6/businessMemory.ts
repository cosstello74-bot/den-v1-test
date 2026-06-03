/**
 * v6 Business Memory System.
 *
 * Stores long-term system intelligence across sessions.
 * All state is localStorage-only. SSR-safe.
 *
 * Stored data:
 *   - Winning strategies (action + target + measured impact)
 *   - High revenue patterns (slug + revenue + context)
 *   - Failed expansions (slug + reason)
 *   - User behaviour clusters (purpose + budget + frequency)
 *
 * localStorage key: den_v6_memory
 */

import type { StrategyAction } from "./strategyEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WinningStrategy = {
  action:          StrategyAction;
  target:          string;
  measuredImpact:  number;   // fractional revenue delta actually observed
  usedCount:       number;   // times this action+target was applied
  lastUsed:        number;   // timestamp ms
};

export type RevenuePattern = {
  slug:            string;
  avgRevenue:      number;
  peakRevenue:     number;
  observedCount:   number;
  category:        string;
};

export type FailedExpansion = {
  slug:            string;
  reason:          string;
  attemptedAt:     number;   // timestamp ms
  retryAfter:      number;   // timestamp ms — don't retry before this
};

export type BehaviourCluster = {
  purposeKey:      string;   // e.g. "gaming", "work"
  budgetKey:       string;   // e.g. "budget", "mid-range", "premium"
  frequency:       number;   // observed session count
  avgConvRate:     number;
};

export type BusinessMemory = {
  winningStrategies:  WinningStrategy[];
  revenuePatterns:    RevenuePattern[];
  failedExpansions:   FailedExpansion[];
  behaviourClusters:  BehaviourCluster[];
  lastUpdated:        number;   // timestamp ms
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY         = "den_v6_memory";
const RETRY_COOLDOWN_MS   = 7 * 24 * 60 * 60 * 1000;  // 7 days
const MAX_STRATEGIES      = 50;
const MAX_PATTERNS        = 100;
const MAX_FAILURES        = 50;
const MAX_CLUSTERS        = 30;

// ─── Storage helpers ──────────────────────────────────────────────────────────

function emptyMemory(): BusinessMemory {
  return {
    winningStrategies: [],
    revenuePatterns:   [],
    failedExpansions:  [],
    behaviourClusters: [],
    lastUpdated:       0,
  };
}

export function loadMemory(): BusinessMemory {
  if (typeof window === "undefined") return emptyMemory();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyMemory();
    return { ...emptyMemory(), ...(JSON.parse(raw) as BusinessMemory) };
  } catch {
    return emptyMemory();
  }
}

export function saveMemory(memory: BusinessMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...memory, lastUpdated: Date.now() }));
  } catch {
    // quota exceeded — silent fail
  }
}

export function clearMemory(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Winning strategies ───────────────────────────────────────────────────────

export function recordWinningStrategy(
  action:  StrategyAction,
  target:  string,
  impact:  number
): void {
  const mem = loadMemory();
  const existing = mem.winningStrategies.find(
    (s) => s.action === action && s.target === target
  );

  if (existing) {
    // Moving average of measured impact
    existing.measuredImpact = (existing.measuredImpact * existing.usedCount + impact) / (existing.usedCount + 1);
    existing.usedCount++;
    existing.lastUsed = Date.now();
  } else {
    mem.winningStrategies.push({ action, target, measuredImpact: impact, usedCount: 1, lastUsed: Date.now() });
    if (mem.winningStrategies.length > MAX_STRATEGIES) {
      mem.winningStrategies.sort((a, b) => b.measuredImpact - a.measuredImpact);
      mem.winningStrategies.splice(MAX_STRATEGIES);
    }
  }

  saveMemory(mem);
}

export function getTopStrategies(limit = 10): WinningStrategy[] {
  return loadMemory()
    .winningStrategies
    .sort((a, b) => b.measuredImpact - a.measuredImpact)
    .slice(0, limit);
}

// ─── Revenue patterns ─────────────────────────────────────────────────────────

export function recordRevenuePattern(slug: string, revenue: number, category: string): void {
  const mem = loadMemory();
  const existing = mem.revenuePatterns.find((p) => p.slug === slug);

  if (existing) {
    existing.avgRevenue    = (existing.avgRevenue * existing.observedCount + revenue) / (existing.observedCount + 1);
    existing.peakRevenue   = Math.max(existing.peakRevenue, revenue);
    existing.observedCount++;
  } else {
    mem.revenuePatterns.push({ slug, avgRevenue: revenue, peakRevenue: revenue, observedCount: 1, category });
    if (mem.revenuePatterns.length > MAX_PATTERNS) {
      mem.revenuePatterns.sort((a, b) => b.avgRevenue - a.avgRevenue);
      mem.revenuePatterns.splice(MAX_PATTERNS);
    }
  }

  saveMemory(mem);
}

export function getTopRevenuePatterns(limit = 10): RevenuePattern[] {
  return loadMemory()
    .revenuePatterns
    .sort((a, b) => b.avgRevenue - a.avgRevenue)
    .slice(0, limit);
}

// ─── Failed expansions ────────────────────────────────────────────────────────

export function recordFailedExpansion(slug: string, reason: string): void {
  const mem = loadMemory();
  const existing = mem.failedExpansions.find((f) => f.slug === slug);
  const now = Date.now();

  if (existing) {
    existing.reason      = reason;
    existing.attemptedAt = now;
    existing.retryAfter  = now + RETRY_COOLDOWN_MS;
  } else {
    mem.failedExpansions.push({ slug, reason, attemptedAt: now, retryAfter: now + RETRY_COOLDOWN_MS });
    if (mem.failedExpansions.length > MAX_FAILURES) {
      mem.failedExpansions.sort((a, b) => b.attemptedAt - a.attemptedAt);
      mem.failedExpansions.splice(MAX_FAILURES);
    }
  }

  saveMemory(mem);
}

export function isExpansionBlocked(slug: string): boolean {
  const mem = loadMemory();
  const f   = mem.failedExpansions.find((fe) => fe.slug === slug);
  if (!f) return false;
  return Date.now() < f.retryAfter;
}

// ─── Behaviour clusters ───────────────────────────────────────────────────────

export function recordBehaviourCluster(purposeKey: string, budgetKey: string, convRate: number): void {
  const mem = loadMemory();
  const existing = mem.behaviourClusters.find(
    (c) => c.purposeKey === purposeKey && c.budgetKey === budgetKey
  );

  if (existing) {
    existing.avgConvRate = (existing.avgConvRate * existing.frequency + convRate) / (existing.frequency + 1);
    existing.frequency++;
  } else {
    mem.behaviourClusters.push({ purposeKey, budgetKey, frequency: 1, avgConvRate: convRate });
    if (mem.behaviourClusters.length > MAX_CLUSTERS) {
      mem.behaviourClusters.sort((a, b) => b.frequency - a.frequency);
      mem.behaviourClusters.splice(MAX_CLUSTERS);
    }
  }

  saveMemory(mem);
}

export function getTopBehaviourClusters(limit = 10): BehaviourCluster[] {
  return loadMemory()
    .behaviourClusters
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}
