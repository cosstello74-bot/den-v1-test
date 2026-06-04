/**
 * V16 Shadow Ranking
 *
 * Runs V15 and V16 ranking in parallel and logs diffs.
 * Used during the V16 migration window to verify V16 produces
 * identical outputs before cutting over live traffic.
 *
 * Activated by the ENABLE_SHADOW_RANKING feature flag.
 * Safe to deploy at any time — shadow mode has zero user-facing effect.
 */

import type { Recommendation }              from "@/types/product";
import type { RevenueModelSnapshot }        from "../metrics/revenueMetrics";
import type { UserContext, ShadowDiff }     from "./types";
import { applyCompositeRanking }            from "../compositeRanking";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { ShadowDiff };

// ─── Shadow compare ───────────────────────────────────────────────────────────

/**
 * Compare two ranked recommendation lists and return a diff.
 *
 * Both lists should be the output of applyCompositeRanking() with the
 * same input — one from the current path, one from the candidate path.
 * "v15" and "v16" are labels only; the function doesn't care about the
 * source, just the rank positions.
 */
export function shadowCompare(
  v15Recs: Recommendation[],
  v16Recs: Recommendation[],
): ShadowDiff {
  const details: ShadowDiff["details"] = [];

  // Build rank lookup from each list
  const v15Ranks = new Map(v15Recs.map((r, i) => [r.product.id, i + 1]));
  const v16Ranks = new Map(v16Recs.map((r, i) => [r.product.id, i + 1]));

  // Check every product in V15 against V16
  for (const [productId, v15Rank] of v15Ranks) {
    const v16Rank = v16Ranks.get(productId) ?? -1;
    const delta   = Math.abs(v16Rank - v15Rank);

    if (delta > 0) {
      details.push({ productId, v15Rank, v16Rank, delta });
    }
  }

  const divergedCount = details.length;
  const topChanged    = details.some((d) => d.v15Rank === 1 || d.v16Rank === 1);

  if (divergedCount > 0) {
    console.warn(
      `[V16 Shadow] ${divergedCount} rank divergence(s). Top-1 changed: ${topChanged}.`,
      details,
    );
  }

  return { divergedCount, topChanged, details };
}

/**
 * Run shadow ranking: produce ranked results via the current path and
 * an experimental path, then compare them.
 *
 * Pass the same inputs to both paths. The caller is responsible for
 * providing the experimental ranked list.
 */
export function runShadowRanking(
  current:      Recommendation[],
  experimental: Recommendation[],
  revenueModel: RevenueModelSnapshot | null,
  context:      UserContext,
): ShadowDiff {
  const v15Ranked = applyCompositeRanking(current,      revenueModel, context);
  const v16Ranked = applyCompositeRanking(experimental, revenueModel, context);

  return shadowCompare(v15Ranked, v16Ranked);
}
