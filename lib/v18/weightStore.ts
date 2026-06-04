/**
 * V18 Learning — Weight Store
 *
 * Versioned, append-only store for scoring weight snapshots.
 *
 * RULES (architectural hard contract):
 *   1. Never overwrite a previous snapshot — only append new versions
 *   2. Rollback is always instant: call rollback() to revert to any version
 *   3. Weights affect ONLY scoring inputs, never ranking order
 *   4. All weight deltas are clamped to safe ranges (enforced at write time)
 *
 * Weights govern the relative importance of scoring dimensions.
 * They are consumed by the scoring layer, not the ranking layer.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeightSnapshot {
  version:          string;    // semver-style: "1.0.0"
  createdAt:        number;    // Unix ms
  relevanceWeight:  number;    // [0.5, 1.0]  — weight on relevance score
  truthWeight:      number;    // [0.5, 1.2]  — multiplier from verified outcomes
  constraintWeight: number;    // [0.5, 1.5]  — weight on hard constraints (brand, size)
  source:           "default" | "learning" | "manual";
  notes?:           string;
}

// ─── Safe ranges ──────────────────────────────────────────────────────────────

const WEIGHT_BOUNDS: Record<keyof Omit<WeightSnapshot, "version" | "createdAt" | "source" | "notes">, [number, number]> = {
  relevanceWeight:  [0.50, 1.00],
  truthWeight:      [0.50, 1.20],
  constraintWeight: [0.50, 1.50],
};

function clampWeight(key: keyof typeof WEIGHT_BOUNDS, value: number): number {
  const [min, max] = WEIGHT_BOUNDS[key];
  return Math.max(min, Math.min(max, value));
}

// ─── Default weights ──────────────────────────────────────────────────────────

const DEFAULT_SNAPSHOT: WeightSnapshot = {
  version:          "1.0.0",
  createdAt:        0,
  relevanceWeight:  1.0,
  truthWeight:      1.0,
  constraintWeight: 1.0,
  source:           "default",
};

// ─── Append-only log ──────────────────────────────────────────────────────────

const _snapshots: WeightSnapshot[] = [{ ...DEFAULT_SNAPSHOT, createdAt: Date.now() }];

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get the current (latest) weight snapshot. */
export function getCurrentWeights(): WeightSnapshot {
  return _snapshots[_snapshots.length - 1];
}

/** Get all snapshots (full history). */
export function getWeightHistory(): ReadonlyArray<WeightSnapshot> {
  return [..._snapshots];
}

/**
 * Write a new weight snapshot. Enforces clamping and appends.
 * Cannot overwrite existing versions.
 */
export function writeWeightSnapshot(
  weights: {
    relevanceWeight?:  number;
    truthWeight?:      number;
    constraintWeight?: number;
  },
  source: WeightSnapshot["source"],
  notes?: string,
): WeightSnapshot {
  const current = getCurrentWeights();

  const newSnapshot: WeightSnapshot = {
    version:          bumpVersion(current.version),
    createdAt:        Date.now(),
    relevanceWeight:  clampWeight("relevanceWeight",  weights.relevanceWeight  ?? current.relevanceWeight),
    truthWeight:      clampWeight("truthWeight",      weights.truthWeight      ?? current.truthWeight),
    constraintWeight: clampWeight("constraintWeight", weights.constraintWeight ?? current.constraintWeight),
    source,
    notes,
  };

  _snapshots.push(newSnapshot);
  return newSnapshot;
}

/**
 * Roll back to a specific version.
 * Creates a NEW snapshot (rollback is a forward operation, preserving history).
 */
export function rollback(toVersion: string, reason: string): WeightSnapshot | null {
  const target = _snapshots.find((s) => s.version === toVersion);
  if (!target) return null;

  const rollbackSnapshot: WeightSnapshot = {
    ...target,
    version:   bumpVersion(getCurrentWeights().version),
    createdAt: Date.now(),
    source:    "manual",
    notes:     `Rollback to ${toVersion}: ${reason}`,
  };

  _snapshots.push(rollbackSnapshot);
  return rollbackSnapshot;
}

function bumpVersion(v: string): string {
  const parts = v.split(".").map(Number);
  parts[2] = (parts[2] ?? 0) + 1;
  return parts.join(".");
}

export function clearWeightHistory(): void {
  _snapshots.length = 0;
  _snapshots.push({ ...DEFAULT_SNAPSHOT, createdAt: Date.now() });
}
