/**
 * V14 — Full Autonomous Commerce Brain
 * The closed-loop controller that consumes V3–V13 and runs the complete
 * self-improving cycle:
 *
 *   Traffic → Behaviour → Revenue → Learning → Expansion
 *
 * One call to runAutonomousCycle() advances the entire system by one tick.
 * Safe to call on a cron schedule (e.g. every 6 hours via /api/v2/cycle).
 */

import type { Product, CategoryKey }    from "@/types/product";
import type { DenNode }                 from "@/lib/v7/ecosystemOrchestrator";
import type { PageMetrics }             from "@/lib/v2/types";

// V8 — Revenue feedback
import {
  aggregateByNiche,
  applyFeedback,
  enrichBlueprintsWithRevenue,
  getSuppressedNiches,
} from "@/lib/v8/revenueBrain";

// V9 — SEO optimiser
import { runSeoOptimiser, getPruneSet } from "@/lib/v9/seoOptimizer";

// V10 — Product optimiser
import { rankWithLearning, buildReport as buildProductReport } from "@/lib/v10/productOptimizer";

// V11 — Affiliate optimiser
import { buildOptimisedLinkMap, estimateRevenueUplift, optimiseAffiliateBatch } from "@/lib/v11/affiliateOptimizer";

// V12 — Semantic expansion
import { generateSemanticExpansions } from "@/lib/v12/semanticExpansion";

// V13 — Growth gate
import { runGrowthGate, buildPruneSet } from "@/lib/v13/growthEngine";

// V7 — Node generation
import { generateCandidateNodes } from "@/lib/v7/nodeGenerator";
import type { NodeBlueprint }     from "@/lib/v7/nodeGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CycleContext = {
  nodes:       DenNode[];
  products:    Product[];
  metrics:     PageMetrics[];
  generation:  number;
};

export type CycleOutput = {
  cycleId:         string;
  timestamp:       number;
  newNodes:        DenNode[];
  pruneTargets:    Set<string>;
  optimisedLinks:  Record<string, string>;
  feedbackApplied: ReturnType<typeof applyFeedback>;
  revenueUplift:   ReturnType<typeof estimateRevenueUplift>;
  productReport:   ReturnType<typeof buildProductReport>;
  summary:         string[];
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runAutonomousCycle(ctx: CycleContext): Promise<CycleOutput> {
  const cycleId   = `cycle_${Date.now().toString(36)}`;
  const timestamp = Date.now();
  const log: string[] = [];

  log.push(`[V14] Autonomous cycle started — ${cycleId}`);

  // ── Step 1: SEO optimisation (V9) ────────────────────────────────────────
  const seoReport  = runSeoOptimiser(ctx.metrics);
  const pruneTargets = getPruneSet(seoReport);
  log.push(`[V9]  Pages scored: ${seoReport.totalPages} | boost: ${seoReport.boostCount} | prune: ${seoReport.pruneCount}`);

  // ── Step 2: Revenue feedback (V8) ────────────────────────────────────────
  const nichePerf       = aggregateByNiche(ctx.metrics, ctx.nodes);
  const feedbackApplied = applyFeedback(ctx.nodes, nichePerf);
  const suppressed      = getSuppressedNiches(nichePerf);
  log.push(`[V8]  Niche feedback applied | suppressed niches: ${suppressed.size}`);

  // ── Step 3: Affiliate optimisation (V11) ──────────────────────────────────
  const optimisedLinks  = buildOptimisedLinkMap(ctx.products);
  const affiliateDecisions = optimiseAffiliateBatch(ctx.products);
  const revenueUplift   = estimateRevenueUplift(affiliateDecisions);
  log.push(`[V11] Affiliate optimisation | EV uplift: ${revenueUplift.upliftPct.toFixed(1)}%`);

  // ── Step 4: Product ranking intelligence (V10) ────────────────────────────
  const productReport = buildProductReport();
  log.push(`[V10] Product optimizer | learned products: ${productReport.learnedProducts} | top performers: ${productReport.topPerformers.length}`);

  // ── Step 5: Semantic expansion (V12) ─────────────────────────────────────
  const activeNiches  = ctx.nodes.filter((n) => n.status === "active").map((n) => n.niche);
  const existingNiches = ctx.nodes.map((n) => n.niche);

  const semanticBlueprints = generateSemanticExpansions(activeNiches, existingNiches, 10);
  log.push(`[V12] Semantic expansion generated ${semanticBlueprints.length} candidate(s)`);

  // ── Step 6: Revenue-enrich blueprints (V8) ───────────────────────────────
  const enrichedBlueprints = enrichBlueprintsWithRevenue(semanticBlueprints, nichePerf);

  // ── Step 7: Growth gate (V13) ────────────────────────────────────────────
  const { approved, rejected, summary: growthSummary } = runGrowthGate(
    enrichedBlueprints,
    nichePerf,
    ctx.nodes.length
  );
  log.push(`[V13] ${growthSummary}`);

  // Filter suppressed niches from approved
  const gatedBlueprints = approved.filter(
    (bp) => !suppressed.has(bp.niche.toLowerCase())
  );

  // ── Step 8: Node generation (V7) ─────────────────────────────────────────
  const topNodes  = [...ctx.nodes]
    .sort((a, b) => b.revenueScore - a.revenueScore)
    .slice(0, 3);

  const newNodes  = gatedBlueprints.length > 0
    ? generateCandidateNodes(
        [],              // opportunities already handled via blueprints
        [],              // revenue patterns already handled via V8
        topNodes,
        existingNiches,
        ctx.generation,
        gatedBlueprints.length
      ).filter((n) => !suppressed.has(n.niche.toLowerCase()) && !pruneTargets.has(n.niche))
    : [];

  log.push(`[V7]  New nodes generated: ${newNodes.length}`);
  log.push(`[V14] Cycle complete — ${newNodes.length} new pages queued, ${pruneTargets.size} flagged for pruning`);

  return {
    cycleId,
    timestamp,
    newNodes,
    pruneTargets,
    optimisedLinks,
    feedbackApplied,
    revenueUplift,
    productReport,
    summary: log,
  };
}

// ─── Cron-safe wrapper ────────────────────────────────────────────────────────
// Called by /api/v2/cycle GET handler

export async function runCycleFromApi(
  loadContext: () => Promise<CycleContext>
): Promise<{ ok: boolean; summary: string[] }> {
  try {
    const ctx    = await loadContext();
    const output = await runAutonomousCycle(ctx);
    return { ok: true, summary: output.summary };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, summary: [`[V14] Cycle failed: ${msg}`] };
  }
}
