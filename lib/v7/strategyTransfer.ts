/**
 * v7 Strategy Transfer System.
 *
 * Transfers successful strategies between nodes.
 * Only transfers strategies that have demonstrated improvement in the
 * source node's performance metrics. Recipient node's strategy is
 * blended with the donor's at a configurable transfer rate.
 *
 * Pure function — no I/O.
 */

import type { DenNode } from "./ecosystemOrchestrator";
import type { VariantWeights } from "@/lib/v5/variantEngine";
import { normalizeWeights } from "@/lib/v5/variantEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransferableStrategy = {
  strategyId:    string;
  sourceNodeId:  string;
  sourceNiche:   string;
  weights:       VariantWeights;
  revenueImpact: number;   // fractional delta observed on source node
  convImpact:    number;   // conversion rate delta observed on source node
  transferCount: number;   // times this strategy has been transferred
};

export type TransferResult = {
  recipientNodeId: string;
  donorNodeId:     string;
  strategyId:      string;
  blendedWeights:  VariantWeights;
  transferRate:    number;
  improved:        boolean;
};

// ─── Strategy weight profiles ─────────────────────────────────────────────────

/** Base weight profiles for each named strategy. */
const STRATEGY_WEIGHTS: Record<string, VariantWeights> = {
  revenue_optimised:    { relevanceWeight: 0.30, revenueWeight: 0.55, behaviorWeight: 0.15 },
  relevance_first:      { relevanceWeight: 0.70, revenueWeight: 0.20, behaviorWeight: 0.10 },
  hybrid_balanced:      { relevanceWeight: 0.50, revenueWeight: 0.35, behaviorWeight: 0.15 },
  engagement_weighted:  { relevanceWeight: 0.45, revenueWeight: 0.30, behaviorWeight: 0.25 },
};

export function getStrategyWeights(strategyName: string): VariantWeights {
  return STRATEGY_WEIGHTS[strategyName] ?? STRATEGY_WEIGHTS["hybrid_balanced"];
}

// ─── Transfer eligibility ─────────────────────────────────────────────────────

/**
 * A node qualifies as a strategy donor if:
 *   - status is "active"
 *   - revenueScore > 0
 *   - conversionRate >= minConvRate
 */
export function isEligibleDonor(node: DenNode, minConvRate = 0.03): boolean {
  return node.status === "active" && node.revenueScore > 0 && node.conversionRate >= minConvRate;
}

/**
 * A node qualifies as a strategy recipient if:
 *   - status is "seeding" or "active"
 *   - conversionRate < donor's conversionRate
 */
export function isEligibleRecipient(recipient: DenNode, donor: DenNode): boolean {
  return (
    (recipient.status === "seeding" || recipient.status === "active") &&
    recipient.conversionRate < donor.conversionRate
  );
}

// ─── Weight blending ──────────────────────────────────────────────────────────

/**
 * Blend recipient's current strategy weights with donor's weights.
 * transferRate controls how much of the donor's profile to absorb.
 * transferRate = 0.3 means: 70% recipient + 30% donor.
 */
export function blendWeights(
  recipientWeights: VariantWeights,
  donorWeights:     VariantWeights,
  transferRate:     number
): VariantWeights {
  const r = Math.max(0, Math.min(1, transferRate));
  const raw: VariantWeights = {
    relevanceWeight: recipientWeights.relevanceWeight * (1 - r) + donorWeights.relevanceWeight * r,
    revenueWeight:   recipientWeights.revenueWeight   * (1 - r) + donorWeights.revenueWeight   * r,
    behaviorWeight:  recipientWeights.behaviorWeight  * (1 - r) + donorWeights.behaviorWeight  * r,
  };
  return normalizeWeights(raw);
}

// ─── Transfer execution ───────────────────────────────────────────────────────

/**
 * Execute a strategy transfer from a donor to a recipient node.
 * Returns the blended weights and whether the transfer improves the recipient.
 */
export function executeTransfer(
  recipient:    DenNode,
  donor:        DenNode,
  transferRate = 0.30
): TransferResult {
  const recipientWeights = getStrategyWeights(recipient.baseStrategy);
  const donorWeights     = getStrategyWeights(donor.baseStrategy);
  const blended          = blendWeights(recipientWeights, donorWeights, transferRate);

  // "Improved" heuristic: donor has higher conv rate AND the donor strategy
  // has higher revenueWeight than the recipient's current profile.
  const improved =
    donor.conversionRate > recipient.conversionRate &&
    donorWeights.revenueWeight > recipientWeights.revenueWeight;

  return {
    recipientNodeId: recipient.nodeId,
    donorNodeId:     donor.nodeId,
    strategyId:      `transfer_${donor.nodeId}_to_${recipient.nodeId}`,
    blendedWeights:  blended,
    transferRate,
    improved,
  };
}

/**
 * Run strategy transfers from the top-performing donor to all eligible recipients.
 * Returns transfer results and an updated node list (only recipients change).
 */
export function propagateTopStrategy(
  nodes:        DenNode[],
  transferRate = 0.30
): { results: TransferResult[]; updatedNodes: DenNode[] } {
  const donors = nodes.filter((n) => isEligibleDonor(n)).sort((a, b) => b.conversionRate - a.conversionRate);
  if (donors.length === 0) return { results: [], updatedNodes: nodes };

  const topDonor = donors[0];
  const results: TransferResult[]  = [];
  const updatedNodes = nodes.map((node) => {
    if (!isEligibleRecipient(node, topDonor)) return node;
    const result = executeTransfer(node, topDonor, transferRate);
    results.push(result);
    // Update recipient's baseStrategy name to "transferred" blend indicator
    return { ...node, baseStrategy: `blend_from_${topDonor.nodeId}`, lastUpdatedAt: Date.now() };
  });

  return { results, updatedNodes };
}
