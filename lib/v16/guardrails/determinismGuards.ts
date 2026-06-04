/**
 * V16 Guardrails — Determinism guards.
 *
 * Verifies that identical inputs always produce identical rank outputs.
 * Uses a hash of (category + params) as input key and a hash of
 * the resulting rank order as output key.
 *
 * In production: call recordRankOutput() after each ranking call.
 * checkDeterminism() compares the new output hash against the stored
 * one for the same input key.
 */

import type { GuardrailViolation } from "../types";
import { hashInputParams, hashRankOrder } from "./hashUtils";

// ─── In-memory determinism ledger ────────────────────────────────────────────
// inputHash → outputHash of the first time this input was ranked

const _ledger = new Map<string, string>();

/**
 * Record the rank output for a given (category, params) input.
 * Returns a violation if the output contradicts a previously recorded result.
 */
export function recordRankOutput(
  category:   string,
  params:     Record<string, string>,
  productIds: string[],
): GuardrailViolation | null {
  const inputKey  = hashInputParams(category, params);
  const outputKey = hashRankOrder(productIds);
  const stored    = _ledger.get(inputKey);

  if (stored === undefined) {
    _ledger.set(inputKey, outputKey);
    return null;
  }

  if (stored !== outputKey) {
    return {
      rule:    "NON_DETERMINISTIC_RANKING",
      message: `Same input (${inputKey}) produced different rank order. ` +
               `Previous: ${stored}, Current: ${outputKey}.`,
      data:    { inputKey, storedHash: stored, newHash: outputKey, category, params },
    };
  }

  return null;
}

/** Clear the determinism ledger (test isolation). */
export function clearDeterminismLedger(): void {
  _ledger.clear();
}

/** Snapshot the current ledger (for serialisation / persistence). */
export function getLedgerSnapshot(): Record<string, string> {
  return Object.fromEntries(_ledger.entries());
}
