/**
 * V16 Observability — Revenue Audit
 *
 * Logs when the epsilon tiebreaker fires — i.e. when two products have
 * scores within TIEBREAK_EPSILON and revenueScore determines which ranks
 * higher. This is the intended behaviour, but it should be rare and
 * auditable.
 *
 * Emits a "revenue_tiebreak_fired" event to the event collector when
 * a tiebreak is detected. Provides audit snapshots for review.
 */

import type { RevenueEnrichedRecommendation } from "../types";
import { TIEBREAK_EPSILON }                   from "../config";
import { emitEvent }                          from "./eventCollector";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TiebreakAuditEntry {
  category:    string;
  higherRank:  number;
  lowerRank:   number;
  higherProduct: string;
  lowerProduct:  string;
  scoreDiff:   number;
  revenueDiff: number;
}

// ─── In-memory audit log ──────────────────────────────────────────────────────

const _log: TiebreakAuditEntry[] = [];
const MAX_LOG = 200;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scan ranked results for epsilon tiebreaks and emit audit events.
 * Call after ranking; does not modify the ranked list.
 */
export function auditRevenueTiebreaks(
  category: string,
  ranked:   RevenueEnrichedRecommendation[],
): TiebreakAuditEntry[] {
  const entries: TiebreakAuditEntry[] = [];

  for (let i = 0; i < ranked.length - 1; i++) {
    const higher = ranked[i];
    const lower  = ranked[i + 1];

    const scoreDiff   = higher.score - lower.score;
    const revenueDiff = higher.revenueScore - lower.revenueScore;

    // Tiebreak = scores within epsilon AND revenue breaks the tie
    if (Math.abs(scoreDiff) <= TIEBREAK_EPSILON && revenueDiff !== 0) {
      const entry: TiebreakAuditEntry = {
        category,
        higherRank:    higher.rank,
        lowerRank:     lower.rank,
        higherProduct: higher.product.id,
        lowerProduct:  lower.product.id,
        scoreDiff,
        revenueDiff,
      };

      entries.push(entry);

      // Emit to event collector
      emitEvent({
        type:      "revenue_tiebreak_fired",
        timestamp:  Date.now(),
        category,
        productId:  higher.product.id,
        rank:       higher.rank,
        metadata: {
          lowerProduct: lower.product.id,
          scoreDiff,
          revenueDiff,
        },
      });
    }
  }

  // Append to audit log
  for (const entry of entries) {
    _log.push(entry);
    if (_log.length > MAX_LOG) _log.shift();
  }

  return entries;
}

export function getTiebreakLog(): TiebreakAuditEntry[] {
  return [..._log];
}

export function clearTiebreakLog(): void {
  _log.length = 0;
}
