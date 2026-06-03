/**
 * v6 Revenue Control Center.
 *
 * Controls global monetisation behaviour.
 * Adjusts global revenue/relevance/behavior weights system-wide,
 * simulates revenue outcomes per strategy, and persists the global
 * weight override to localStorage.
 *
 * All variants in v5 start from their base profiles; the global override
 * applies an additive bias before variant-level optimisation.
 *
 * localStorage key: den_v6_revenue_control
 * SSR-safe.
 */

import type { VariantId, VariantWeights } from "@/lib/v5/variantEngine";
import { BASE_VARIANT_PROFILES, normalizeWeights } from "@/lib/v5/variantEngine";
import type { Strategy } from "./strategyEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GlobalWeights = {
  globalRevenueWeight:    number;   // 0–1
  globalRelevanceWeight:  number;   // 0–1
  globalBehaviorWeight:   number;   // 0–1
  // invariant: sum === 1.0
};

export type RevenueOutcomeSimulation = {
  strategy:              Strategy;
  currentRevenue:        number;  // simulated baseline
  projectedRevenue:      number;  // after applying strategy
  delta:                 number;  // projectedRevenue - currentRevenue
  relativeImpact:        number;  // delta / currentRevenue (or 0 if base is 0)
};

export type RevenueControlState = {
  globalWeights:    GlobalWeights;
  lockedVariant:    VariantId | null;  // if set, all sessions use this variant
  lastAdjustedAt:   number;            // timestamp ms
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "den_v6_revenue_control";

/** Default global weights — balanced, no revenue lean. */
export const DEFAULT_GLOBAL_WEIGHTS: GlobalWeights = {
  globalRevenueWeight:   0.35,
  globalRelevanceWeight: 0.50,
  globalBehaviorWeight:  0.15,
};

/** Maximum per-step adjustment to any dimension. Prevents runaway shifts. */
const MAX_STEP = 0.10;

// ─── Storage helpers ──────────────────────────────────────────────────────────

function defaultState(): RevenueControlState {
  return {
    globalWeights:  { ...DEFAULT_GLOBAL_WEIGHTS },
    lockedVariant:  null,
    lastAdjustedAt: 0,
  };
}

export function loadRevenueControlState(): RevenueControlState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...(JSON.parse(raw) as RevenueControlState) };
  } catch {
    return defaultState();
  }
}

export function saveRevenueControlState(state: RevenueControlState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, lastAdjustedAt: Date.now() }));
  } catch {
    // quota exceeded — silent fail
  }
}

export function clearRevenueControlState(): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

// ─── Weight manipulation ──────────────────────────────────────────────────────

/**
 * Clamp a per-step delta to prevent runaway weight shifts.
 */
function clampDelta(delta: number): number {
  return Math.max(-MAX_STEP, Math.min(MAX_STEP, delta));
}

/**
 * Shift the global revenue weight by `delta`, then re-normalise.
 * Persists automatically.
 */
export function adjustRevenueWeight(delta: number): GlobalWeights {
  const state = loadRevenueControlState();
  const w     = state.globalWeights;

  const newRevenue = Math.min(0.80, Math.max(0.10, w.globalRevenueWeight + clampDelta(delta)));
  const remainder  = 1 - newRevenue;
  const ratio      = w.globalRelevanceWeight / Math.max(w.globalRelevanceWeight + w.globalBehaviorWeight, 0.001);

  const raw: VariantWeights = {
    relevanceWeight: remainder * ratio,
    revenueWeight:   newRevenue,
    behaviorWeight:  remainder * (1 - ratio),
  };
  const normalised = normalizeWeights(raw);

  const updated: GlobalWeights = {
    globalRevenueWeight:   normalised.revenueWeight,
    globalRelevanceWeight: normalised.relevanceWeight,
    globalBehaviorWeight:  normalised.behaviorWeight,
  };

  saveRevenueControlState({ ...state, globalWeights: updated });
  return updated;
}

/**
 * Lock all sessions to a specific variant (overrides v5 test orchestrator).
 * Pass null to unlock.
 */
export function setLockedVariant(variantId: VariantId | null): void {
  const state = loadRevenueControlState();
  saveRevenueControlState({ ...state, lockedVariant: variantId });
}

// ─── Revenue outcome simulation ───────────────────────────────────────────────

/**
 * Simulate revenue outcomes for a list of strategies given a baseline revenue.
 * Returns simulations sorted by projected revenue descending.
 */
export function simulateRevenueOutcomes(
  strategies:      Strategy[],
  baselineRevenue: number
): RevenueOutcomeSimulation[] {
  return strategies
    .map((s) => {
      const projected = Math.round(baselineRevenue * (1 + s.expectedRevenueImpact) * 100) / 100;
      const delta     = Math.round((projected - baselineRevenue) * 100) / 100;
      const rel       = baselineRevenue > 0 ? Math.round((delta / baselineRevenue) * 1000) / 1000 : 0;
      return { strategy: s, currentRevenue: baselineRevenue, projectedRevenue: projected, delta, relativeImpact: rel };
    })
    .sort((a, b) => b.projectedRevenue - a.projectedRevenue);
}

/**
 * Apply global weights as a bias on top of a variant's base profile.
 * The result is a blended weight profile: 50% base variant + 50% global target.
 */
export function applyGlobalWeightBias(
  variantId:     VariantId,
  globalWeights: GlobalWeights
): VariantWeights {
  const base = BASE_VARIANT_PROFILES[variantId].weights;
  const raw: VariantWeights = {
    relevanceWeight: (base.relevanceWeight + globalWeights.globalRelevanceWeight) / 2,
    revenueWeight:   (base.revenueWeight   + globalWeights.globalRevenueWeight)   / 2,
    behaviorWeight:  (base.behaviorWeight  + globalWeights.globalBehaviorWeight)  / 2,
  };
  return normalizeWeights(raw);
}
