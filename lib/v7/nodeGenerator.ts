/**
 * v7 Node Generation Engine.
 *
 * Creates new DEN instances (nodes) for unexplored niches.
 * Derives candidates from:
 *   - High-performing intent clusters (v6 opportunityDetector output)
 *   - Revenue hotspots in businessMemory patterns
 *   - Adjacency expansion from existing node niches
 *
 * New nodes are "seeding" status by default — they must earn
 * traffic share through the selection engine.
 */

import type { DenNode } from "./ecosystemOrchestrator";
import type { Opportunity } from "@/lib/v6/opportunityDetector";
import type { RevenuePattern } from "@/lib/v6/businessMemory";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NodeBlueprint = {
  niche:        string;
  domain:       string;
  baseStrategy: string;
  cloneOf:      string | null;
  sourceSignal: "intent_cluster" | "revenue_hotspot" | "adjacency" | "manual";
  confidence:   number;
};

// ─── Strategy selection ───────────────────────────────────────────────────────

const NICHE_STRATEGY_MAP: Record<string, string> = {
  gaming:       "revenue_optimised",
  student:      "relevance_first",
  coding:       "engagement_weighted",
  developer:    "engagement_weighted",
  budget:       "revenue_optimised",
  creative:     "hybrid_balanced",
  professional: "hybrid_balanced",
  work:         "hybrid_balanced",
  travel:       "relevance_first",
  ai:           "engagement_weighted",
};

function inferStrategy(niche: string): string {
  const lower = niche.toLowerCase();
  for (const [key, strategy] of Object.entries(NICHE_STRATEGY_MAP)) {
    if (lower.includes(key)) return strategy;
  }
  return "hybrid_balanced";
}

function toDomain(niche: string): string {
  return `den-${niche.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.com`;
}

function toNodeId(niche: string, generation: number): string {
  const slug = niche.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `node_${slug}_g${generation}_${Date.now().toString(36)}`;
}

// ─── Candidate generation ─────────────────────────────────────────────────────

/**
 * Generate node blueprints from v6 opportunity signals.
 * Only "intent_gap" and "new_product_category" opportunities are used.
 */
export function blueprintsFromOpportunities(
  opportunities: Opportunity[],
  existingNiches: string[]
): NodeBlueprint[] {
  const existing = new Set(existingNiches.map((n) => n.toLowerCase()));
  return opportunities
    .filter((o) => (o.type === "intent_gap" || o.type === "new_product_category") && o.confidence >= 0.75)
    .filter((o) => !existing.has(o.name.toLowerCase()))
    .map((o) => ({
      niche:        o.name,
      domain:       toDomain(o.name),
      baseStrategy: inferStrategy(o.name),
      cloneOf:      null,
      sourceSignal: "intent_cluster" as const,
      confidence:   o.confidence,
    }));
}

/**
 * Generate node blueprints from revenue hotspots in business memory.
 * Targets categories with high avg revenue and many observations.
 */
export function blueprintsFromRevenuePatterns(
  patterns:       RevenuePattern[],
  existingNiches: string[]
): NodeBlueprint[] {
  const existing = new Set(existingNiches.map((n) => n.toLowerCase()));
  return patterns
    .filter((p) => p.avgRevenue >= 1.0 && p.observedCount >= 3)
    .filter((p) => !existing.has(p.category.toLowerCase()))
    .map((p) => ({
      niche:        `${p.category} laptops`,
      domain:       toDomain(`${p.category} laptops`),
      baseStrategy: inferStrategy(p.category),
      cloneOf:      null,
      sourceSignal: "revenue_hotspot" as const,
      confidence:   Math.min(0.95, 0.70 + p.observedCount * 0.02),
    }));
}

/**
 * Generate adjacency expansions from high-performing existing nodes.
 * Each top-performing node spawns 1 adjacent niche candidate.
 */
export function blueprintsFromAdjacency(
  topNodes:       DenNode[],
  existingNiches: string[]
): NodeBlueprint[] {
  const ADJACENCY_MAP: Record<string, string> = {
    "gaming laptops":          "gaming accessories",
    "student laptops":         "student tablets",
    "developer laptops":       "AI coding tools",
    "work from home laptops":  "home office monitors",
    "budget laptops":          "refurbished laptops",
    "creative laptops":        "video editing laptops",
  };

  const existing = new Set(existingNiches.map((n) => n.toLowerCase()));
  return topNodes
    .slice(0, 3)
    .map((node) => {
      const adjacent = ADJACENCY_MAP[node.niche.toLowerCase()];
      if (!adjacent || existing.has(adjacent.toLowerCase())) return null;
      return {
        niche:        adjacent,
        domain:       toDomain(adjacent),
        baseStrategy: node.baseStrategy,
        cloneOf:      node.nodeId,
        sourceSignal: "adjacency" as const,
        confidence:   Math.min(0.90, node.conversionRate + 0.60),
      };
    })
    .filter((b): b is NodeBlueprint => b !== null);
}

// ─── Node creation ────────────────────────────────────────────────────────────

/**
 * Instantiate a DenNode from a blueprint.
 */
export function createNodeFromBlueprint(blueprint: NodeBlueprint, generation: number): DenNode {
  const now = Date.now();
  return {
    nodeId:         toNodeId(blueprint.niche, generation),
    niche:          blueprint.niche,
    domain:         blueprint.domain,
    trafficShare:   0.05,   // starts with minimal traffic — earned through selection
    revenueScore:   0,
    conversionRate: 0,
    status:         "seeding",
    baseStrategy:   blueprint.baseStrategy,
    cloneOf:        blueprint.cloneOf,
    generation,
    createdAt:      now,
    lastUpdatedAt:  now,
  };
}

/**
 * Generate all candidate nodes for the current cycle.
 * Deduplicates by niche against existing node niches.
 * Returns at most `limit` new nodes (default: 3).
 */
export function generateCandidateNodes(
  opportunities:    Opportunity[],
  revenuePatterns:  RevenuePattern[],
  topNodes:         DenNode[],
  existingNiches:   string[],
  generation:       number,
  limit            = 3
): DenNode[] {
  const blueprints = [
    ...blueprintsFromOpportunities(opportunities, existingNiches),
    ...blueprintsFromRevenuePatterns(revenuePatterns, existingNiches),
    ...blueprintsFromAdjacency(topNodes, existingNiches),
  ];

  // Deduplicate blueprints by niche, keep highest confidence
  const byNiche = new Map<string, NodeBlueprint>();
  for (const bp of blueprints) {
    const key = bp.niche.toLowerCase();
    if (!byNiche.has(key) || bp.confidence > byNiche.get(key)!.confidence) {
      byNiche.set(key, bp);
    }
  }

  return [...byNiche.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
    .map((bp) => createNodeFromBlueprint(bp, generation));
}
