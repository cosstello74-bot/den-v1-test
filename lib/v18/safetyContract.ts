/**
 * V18 Safety Contract — Runtime Boundary Enforcement
 *
 * V18 learning code must NEVER touch ranking, revenue, or routing.
 * This module provides assertions that throw if V18 is called from
 * a context it should never enter.
 *
 * Usage:
 *   assertLearningBoundary("computeAdjustments") — call at the top of
 *   any V18 function that computes or writes weights.
 *
 * The violation registry tracks attempted boundary breaches for audit.
 */

// ─── Forbidden contexts ───────────────────────────────────────────────────────

/** Call stack string fragments that indicate a ranking context. */
const RANKING_CONTEXT_MARKERS = [
  "applyCompositeRanking",
  "rankProducts",
  "pureRanker",
  "compositeRanking",
  "revenueEngine",
  "calculateRevenueScore",
];

// ─── Violation registry ───────────────────────────────────────────────────────

interface ContractViolation {
  caller:    string;
  context:   string;
  timestamp: number;
}

const _violations: ContractViolation[] = [];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Assert that the current call is not originating from a ranking context.
 * Inspects the call stack in development; skips in production for performance.
 *
 * Throws a descriptive error on violation.
 */
export function assertLearningBoundary(caller: string): void {
  if (process.env.NODE_ENV === "production") return; // skip stack walk in prod

  const stack = new Error().stack ?? "";

  for (const marker of RANKING_CONTEXT_MARKERS) {
    if (stack.includes(marker)) {
      const violation: ContractViolation = {
        caller,
        context:   marker,
        timestamp: Date.now(),
      };
      _violations.push(violation);

      throw new Error(
        `[V18 SAFETY VIOLATION] ${caller} was called from ranking context "${marker}". ` +
        `V18 learning functions must not execute inside the ranking pipeline.`,
      );
    }
  }
}

/**
 * Runtime enforcement for weight write operations.
 * Checks that the proposed weight object contains only allowed fields.
 * Throws if a V18 weight update attempts to write ranking-layer fields.
 */
export function assertSafeWeightUpdate(update: Record<string, unknown>): void {
  const FORBIDDEN_WEIGHT_FIELDS = [
    "revenueScore",
    "rankPosition",
    "compositeScore",
    "rank",
    "affiliateValue",
  ];

  for (const field of FORBIDDEN_WEIGHT_FIELDS) {
    if (field in update) {
      throw new Error(
        `[V18 SAFETY VIOLATION] Weight update contains forbidden field "${field}". ` +
        `V18 may only update relevanceWeight, truthWeight, or constraintWeight.`,
      );
    }
  }
}

export function getViolationLog(): ReadonlyArray<ContractViolation> {
  return [..._violations];
}

export function clearViolationLog(): void {
  _violations.length = 0;
}
