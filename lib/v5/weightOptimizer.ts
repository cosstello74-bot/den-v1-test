/**
 * v5 Weight Optimizer.
 *
 * Dynamic weight adjustment engine.
 * Moves current variant weights toward the best-performing variant's
 * weight profile using a fixed learning rate α = 0.05.
 *
 * Weights always sum to 1.0 (enforced after each update).
 * Persisted to localStorage key: den_v5_weights
 *
 * SSR-safe: all localStorage access is guarded.
 */

import type { VariantId, VariantWeights } from "./variantEngine";
import { BASE_VARIANT_PROFILES, normalizeWeights, validateWeights } from "./variantEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WeightStore = Partial<Record<VariantId, VariantWeights>>;

export type OptimizationStep = {
  variantId:      VariantId;
  before:         VariantWeights;
  after:          VariantWeights;
  targetVariant:  VariantId;
  learningRate:   number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY   = "den_v5_weights";
const LEARNING_RATE = 0.05;

// ─── Storage helpers ──────────────────────────────────────────────────────────

export function loadWeightStore(): WeightStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WeightStore;
    // Validate each entry — discard malformed weights
    const clean: WeightStore = {};
    for (const id of Object.keys(parsed) as VariantId[]) {
      const w = parsed[id];
      if (w && validateWeights(w)) clean[id] = w;
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveWeightStore(store: WeightStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage quota exceeded — silent fail
  }
}

export function clearWeightStore(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Core optimizer ───────────────────────────────────────────────────────────

/**
 * Resolve the current effective weights for a variant.
 * Falls back to base profile if no evolved weights exist.
 */
export function getEffectiveWeights(
  variantId: VariantId,
  store:     WeightStore = {}
): VariantWeights {
  return store[variantId] ?? BASE_VARIANT_PROFILES[variantId].weights;
}

/**
 * Move `current` weights one step toward `target` weights using α.
 * Each dimension is linearly interpolated: w_new = w_old + α × (w_target − w_old)
 * Result is normalized to sum exactly to 1.0.
 */
export function stepTowardTarget(
  current:      VariantWeights,
  target:       VariantWeights,
  learningRate: number = LEARNING_RATE
): VariantWeights {
  const raw: VariantWeights = {
    relevanceWeight: current.relevanceWeight + learningRate * (target.relevanceWeight - current.relevanceWeight),
    revenueWeight:   current.revenueWeight   + learningRate * (target.revenueWeight   - current.revenueWeight),
    behaviorWeight:  current.behaviorWeight  + learningRate * (target.behaviorWeight  - current.behaviorWeight),
  };
  return normalizeWeights(raw);
}

/**
 * Run one optimization step for a specific variant toward the best-performing
 * variant's weight profile. Returns a description of the step taken.
 *
 * If the variant is already the best, no-op (weights unchanged).
 */
export function optimizeVariantWeights(
  variantId:    VariantId,
  bestVariant:  VariantId,
  store:        WeightStore,
  learningRate: number = LEARNING_RATE
): { store: WeightStore; step: OptimizationStep } {
  const before = getEffectiveWeights(variantId, store);
  const target = getEffectiveWeights(bestVariant, store);

  const after = variantId === bestVariant
    ? before  // already the best — no adjustment
    : stepTowardTarget(before, target, learningRate);

  const updatedStore: WeightStore = { ...store, [variantId]: after };

  return {
    store: updatedStore,
    step: {
      variantId,
      before,
      after,
      targetVariant: bestVariant,
      learningRate,
    },
  };
}

/**
 * Run optimization for ALL variants simultaneously toward the best variant.
 * Persists the updated store to localStorage.
 */
export function optimizeAllWeights(
  bestVariant:  VariantId,
  learningRate: number = LEARNING_RATE
): { store: WeightStore; steps: OptimizationStep[] } {
  const store = loadWeightStore();
  const steps: OptimizationStep[] = [];
  let updatedStore: WeightStore = { ...store };

  for (const id of ["A", "B", "C", "D"] as VariantId[]) {
    const { store: next, step } = optimizeVariantWeights(id, bestVariant, updatedStore, learningRate);
    updatedStore = next;
    steps.push(step);
  }

  saveWeightStore(updatedStore);
  return { store: updatedStore, steps };
}

/**
 * Reset all evolved weights — next session will use base profiles.
 */
export function resetWeights(): void {
  clearWeightStore();
}
