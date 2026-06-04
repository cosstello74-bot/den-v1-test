/**
 * V13 — Autonomous Growth Engine
 * Controls the rate and quality of autonomous page/niche generation.
 * Prevents spam explosion by enforcing:
 *   - Per-cycle page caps
 *   - Minimum confidence gates
 *   - Cooldown periods per niche
 *   - Revenue-potential prioritisation
 *
 * Acts as the final gate before V14 commits new nodes to the system.
 */

import type { NodeBlueprint } from "@/lib/v7/nodeGenerator";
import type { NichePerformance } from "@/lib/v8/revenueBrain";
import type { ScoredPage }      from "@/lib/v9/seoOptimizer";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GrowthConfig = {
  maxNewPagesPerCycle:  number;   // hard cap on pages generated per run
  minConfidence:        number;   // blueprints below this are rejected
  cooldownMs:           number;   // ms between regenerating the same niche
  minRevenuePotential:  number;   // £ EV minimum to green-light expansion
  maxTotalPages:        number;   // absolute ceiling on total site pages
};

export const DEFAULT_GROWTH_CONFIG: GrowthConfig = {
  maxNewPagesPerCycle:  3,
  minConfidence:        0.80,
  cooldownMs:           7 * 24 * 60 * 60 * 1000,   // 7 days
  minRevenuePotential:  2.0,
  maxTotalPages:        200,
};

export type GrowthDecision = {
  approved:  NodeBlueprint[];
  rejected:  Array<{ blueprint: NodeBlueprint; reason: string }>;
  summary:   string;
};

// ─── Cooldown registry ────────────────────────────────────────────────────────
// In production, persist this to Supabase

const cooldowns = new Map<string, number>();   // niche → last generated timestamp

export function recordGeneration(niche: string): void {
  cooldowns.set(niche.toLowerCase(), Date.now());
}

export function isOnCooldown(niche: string, cooldownMs: number): boolean {
  const last = cooldowns.get(niche.toLowerCase());
  if (!last) return false;
  return Date.now() - last < cooldownMs;
}

// ─── Revenue potential estimator ─────────────────────────────────────────────

function estimateRevenuePotential(
  niche:       string,
  performance: NichePerformance[]
): number {
  const match = performance.find(
    (p) => p.niche.toLowerCase() === niche.toLowerCase()
  );

  if (!match) return 5.0;   // unknown niche → neutral estimate

  // Use adjacent niche revenue as proxy
  return match.totalRevenue > 0 ? match.totalRevenue * 0.3 : 2.5;
}

// ─── Growth gate ──────────────────────────────────────────────────────────────

export function runGrowthGate(
  blueprints:    NodeBlueprint[],
  performance:   NichePerformance[],
  currentTotal:  number,
  cfg:           GrowthConfig = DEFAULT_GROWTH_CONFIG
): GrowthDecision {
  const approved: NodeBlueprint[]                               = [];
  const rejected: Array<{ blueprint: NodeBlueprint; reason: string }> = [];

  for (const bp of blueprints) {
    // Hard ceiling
    if (currentTotal + approved.length >= cfg.maxTotalPages) {
      rejected.push({ blueprint: bp, reason: `site at max capacity (${cfg.maxTotalPages} pages)` });
      continue;
    }

    // Per-cycle cap
    if (approved.length >= cfg.maxNewPagesPerCycle) {
      rejected.push({ blueprint: bp, reason: `cycle cap reached (${cfg.maxNewPagesPerCycle} pages/cycle)` });
      continue;
    }

    // Confidence gate
    if (bp.confidence < cfg.minConfidence) {
      rejected.push({ blueprint: bp, reason: `confidence ${bp.confidence.toFixed(2)} < minimum ${cfg.minConfidence}` });
      continue;
    }

    // Cooldown gate
    if (isOnCooldown(bp.niche, cfg.cooldownMs)) {
      rejected.push({ blueprint: bp, reason: `niche "${bp.niche}" is on cooldown` });
      continue;
    }

    // Revenue potential gate
    const revPotential = estimateRevenuePotential(bp.niche, performance);
    if (revPotential < cfg.minRevenuePotential) {
      rejected.push({ blueprint: bp, reason: `revenue potential £${revPotential.toFixed(2)} < minimum £${cfg.minRevenuePotential}` });
      continue;
    }

    approved.push(bp);
  }

  // Record approvals in cooldown registry
  approved.forEach((bp) => recordGeneration(bp.niche));

  const summary = `Growth gate: ${approved.length} approved, ${rejected.length} rejected. ` +
    (approved.length > 0 ? `New niches: ${approved.map((b) => b.niche).join(", ")}` : "No expansion this cycle.");

  return { approved, rejected, summary };
}

// ─── Prune candidates from V9 ────────────────────────────────────────────────

export function selectPruneCandidates(
  pages:          ScoredPage[],
  minDataPoints:  number = 50   // min impressions before pruning is allowed
): ScoredPage[] {
  return pages.filter(
    (p) => p.status === "prune"
  );
}

export function buildPruneSet(pages: ScoredPage[]): Set<string> {
  return new Set(selectPruneCandidates(pages).map((p) => p.slug));
}
