  /**
   * v7 Node Generation Engine.                                                                                                                                 *
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
    niche: string;
    domain: string;
    baseStrategy: string;
    cloneOf: string | null;
    sourceSignal: "intent_cluster" | "revenue_hotspot" | "adjacency" | "manual";
    confidence: number;
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  function toDomain(niche: string): string {
    return `den-${niche
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.com`;
  }

  function toNodeId(niche: string, generation: number): string {
    const slug = niche
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
    return `node_${slug}_g${generation}_${Date.now().toString(36)}`;
  }

  function inferStrategy(niche: string): string {
    const lower = niche.toLowerCase();

    if (lower.includes("gaming")) return "revenue_optimised";
    if (lower.includes("student")) return "relevance_first";
    if (lower.includes("developer")) return "engagement_weighted";
    if (lower.includes("budget")) return "revenue_optimised";
    if (lower.includes("creative")) return "hybrid_balanced";

    return "hybrid_balanced";
  }

  // ─── Blueprints: Opportunities ────────────────────────────────────────────────

  export function blueprintsFromOpportunities(
    opportunities: Opportunity[],
    existingNiches: string[]
  ): NodeBlueprint[] {
    const existing = new Set(existingNiches.map((n) => n.toLowerCase()));

    return opportunities
      .filter(
        (o) =>
          (o.type === "intent_gap" ||
            o.type === "new_product_category") &&
          o.confidence >= 0.75
      )
      .filter((o) => !existing.has(o.name.toLowerCase()))
      .map((o) => ({
        niche: o.name,
        domain: toDomain(o.name),
        baseStrategy: inferStrategy(o.name),
        cloneOf: null,
        sourceSignal: "intent_cluster",
        confidence: o.confidence,
      }));
  }

  // ─── Blueprints: Revenue ─────────────────────────────────────────────────────

  export function blueprintsFromRevenuePatterns(
    patterns: RevenuePattern[],
    existingNiches: string[]
  ): NodeBlueprint[] {
    const existing = new Set(existingNiches.map((n) => n.toLowerCase()));

    return patterns
      .filter((p) => p.avgRevenue >= 1.0 && p.observedCount >= 3)
      .filter((p) => !existing.has(`${p.category} laptops`.toLowerCase()))
      .map((p) => {
        const niche = `${p.category} laptops`;

        return {
          niche,
          domain: toDomain(niche),
          baseStrategy: inferStrategy(p.category),
          cloneOf: null,
          sourceSignal: "revenue_hotspot",
          confidence: Math.min(0.95, 0.7 + p.observedCount * 0.02),
        };
      });
  }

  // ─── Blueprints: Adjacency ───────────────────────────────────────────────────

  export function blueprintsFromAdjacency(
    topNodes: DenNode[],
    existingNiches: string[]
  ): NodeBlueprint[] {
    const ADJACENCY_MAP: Record<string, string> = {
      "gaming laptops": "gaming accessories",
      "student laptops": "student tablets",
      "developer laptops": "AI coding tools",
      "work from home laptops": "home office monitors",
      "budget laptops": "refurbished laptops",
      "creative laptops": "video editing laptops",
    };

    const existing = new Set(existingNiches.map((n) => n.toLowerCase()));

    return topNodes
      .slice(0, 3)
      .reduce<NodeBlueprint[]>((acc, node) => {
        const adjacent = ADJACENCY_MAP[node.niche.toLowerCase()];

        if (!adjacent) return acc;
        if (existing.has(adjacent.toLowerCase())) return acc;

        acc.push({
          niche: adjacent,
          domain: toDomain(adjacent),
          baseStrategy: node.baseStrategy,
          cloneOf: node.nodeId,
          sourceSignal: "adjacency",
          confidence: Math.min(0.9, node.conversionRate + 0.6),
        });

        return acc;
      }, []);
  }

  // ─── Node Factory ────────────────────────────────────────────────────────────

  export function createNodeFromBlueprint(
    blueprint: NodeBlueprint,
    generation: number
  ): DenNode {
    const now = Date.now();

    return {
      nodeId: toNodeId(blueprint.niche, generation),
      niche: blueprint.niche,
      domain: blueprint.domain,
      trafficShare: 0.05,
      revenueScore: 0,
      conversionRate: 0,
      status: "seeding",
      baseStrategy: blueprint.baseStrategy,
      cloneOf: blueprint.cloneOf,
      generation,
      createdAt: now,
      lastUpdatedAt: now,
    };
  }

  // ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

  export function generateCandidateNodes(
    opportunities: Opportunity[],
    revenuePatterns: RevenuePattern[],
    topNodes: DenNode[],
    existingNiches: string[],
    generation: number,
    limit = 3
  ): DenNode[] {
    const blueprints = [
      ...blueprintsFromOpportunities(opportunities, existingNiches),
      ...blueprintsFromRevenuePatterns(revenuePatterns, existingNiches),
      ...blueprintsFromAdjacency(topNodes, existingNiches),
    ];

    const byNiche = new Map<string, NodeBlueprint>();

    for (const bp of blueprints) {
      const key = bp.niche.toLowerCase();

      if (
        !byNiche.has(key) ||
        bp.confidence > byNiche.get(key)!.confidence
      ) {
        byNiche.set(key, bp);
      }
    }

    return Array.from(byNiche.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
      .map((bp) => createNodeFromBlueprint(bp, generation));
  }