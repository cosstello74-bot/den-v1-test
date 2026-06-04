/**
 * V12 — Semantic Expansion Engine
 * Expands niches using semantic adjacency and keyword clustering.
 * Generates new node candidates and feeds them into V7 node generator format.
 *
 * More sophisticated than V7's static adjacency map:
 *   - Multi-hop expansion (A → B → C)
 *   - Category-aware clustering
 *   - Confidence decay per hop
 */

import type { CategoryKey }  from "@/types/product";
import type { NodeBlueprint } from "@/lib/v7/nodeGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SemanticCluster = {
  seed:       string;       // originating niche
  expansion:  string;       // derived niche
  category:   CategoryKey;
  hops:       number;       // distance from seed (1 = direct, 2 = second-order)
  confidence: number;
  rationale:  string;
};

// ─── Adjacency graph ──────────────────────────────────────────────────────────
// Each key maps to direct expansions with category and base confidence

type EdgeDef = { niche: string; category: CategoryKey; confidence: number; rationale: string };

const ADJACENCY_GRAPH: Record<string, EdgeDef[]> = {
  "gaming laptops": [
    { niche: "gaming accessories",     category: "laptops",  confidence: 0.82, rationale: "co-purchase pattern" },
    { niche: "gaming monitors",        category: "monitors", confidence: 0.88, rationale: "peripheral expansion" },
    { niche: "budget gaming laptops",  category: "laptops",  confidence: 0.85, rationale: "price-tier split" },
  ],
  "student laptops": [
    { niche: "student tablets",        category: "tablets",  confidence: 0.83, rationale: "alternative form factor" },
    { niche: "budget laptops",         category: "laptops",  confidence: 0.87, rationale: "price sensitivity" },
    { niche: "laptops for university", category: "laptops",  confidence: 0.86, rationale: "keyword variant" },
  ],
  "developer laptops": [
    { niche: "AI coding tools",        category: "pcs",      confidence: 0.80, rationale: "professional workflow" },
    { niche: "work from home laptops", category: "laptops",  confidence: 0.84, rationale: "remote work expansion" },
    { niche: "monitors for coding",    category: "monitors", confidence: 0.81, rationale: "peripheral need" },
  ],
  "budget laptops": [
    { niche: "refurbished laptops",    category: "laptops",  confidence: 0.85, rationale: "price-conscious buyer" },
    { niche: "cheap chromebooks",      category: "laptops",  confidence: 0.78, rationale: "budget segment" },
  ],
  "creative laptops": [
    { niche: "video editing laptops",  category: "laptops",  confidence: 0.88, rationale: "use-case split" },
    { niche: "monitors for editing",   category: "monitors", confidence: 0.83, rationale: "display peripheral" },
    { niche: "best tablets for drawing", category: "tablets", confidence: 0.80, rationale: "creative alternative" },
  ],
  "gaming monitors": [
    { niche: "4K gaming monitors",     category: "monitors", confidence: 0.84, rationale: "spec tier split" },
    { niche: "ultrawide monitors",     category: "monitors", confidence: 0.82, rationale: "form factor expansion" },
  ],
  "smartphones": [
    { niche: "budget smartphones",     category: "phones",   confidence: 0.88, rationale: "price tier split" },
    { niche: "camera phones",          category: "phones",   confidence: 0.85, rationale: "feature focus" },
    { niche: "long battery phones",    category: "phones",   confidence: 0.83, rationale: "use-case split" },
  ],
};

const HOP_CONFIDENCE_DECAY = 0.12;   // each hop reduces confidence by 0.12
const MIN_CONFIDENCE       = 0.70;   // below this, clusters are discarded

// ─── Single-hop expansion ─────────────────────────────────────────────────────

export function expandNiche(
  niche:           string,
  existingNiches:  string[]
): SemanticCluster[] {
  const existing = new Set(existingNiches.map((n) => n.toLowerCase()));
  const edges    = ADJACENCY_GRAPH[niche.toLowerCase()] ?? [];

  return edges
    .filter((e) => !existing.has(e.niche.toLowerCase()))
    .filter((e) => e.confidence >= MIN_CONFIDENCE)
    .map((e) => ({
      seed:       niche,
      expansion:  e.niche,
      category:   e.category,
      hops:       1,
      confidence: e.confidence,
      rationale:  e.rationale,
    }));
}

// ─── Multi-hop expansion ──────────────────────────────────────────────────────

export function expandMultiHop(
  seeds:          string[],
  existingNiches: string[],
  maxHops:        number = 2
): SemanticCluster[] {
  const all      = new Map<string, SemanticCluster>();
  const existing = new Set([
    ...existingNiches.map((n) => n.toLowerCase()),
    ...seeds.map((s) => s.toLowerCase()),
  ]);

  let frontier = seeds;

  for (let hop = 1; hop <= maxHops; hop++) {
    const nextFrontier: string[] = [];

    for (const seed of frontier) {
      const edges = ADJACENCY_GRAPH[seed.toLowerCase()] ?? [];

      for (const e of edges) {
        const key = e.niche.toLowerCase();
        if (existing.has(key)) continue;

        const confidence = e.confidence - HOP_CONFIDENCE_DECAY * (hop - 1);
        if (confidence < MIN_CONFIDENCE) continue;

        if (!all.has(key) || all.get(key)!.confidence < confidence) {
          all.set(key, {
            seed,
            expansion:  e.niche,
            category:   e.category,
            hops:       hop,
            confidence,
            rationale:  `${e.rationale} (${hop === 1 ? "direct" : `${hop}-hop via ${seed}`})`,
          });
          nextFrontier.push(e.niche);
          existing.add(key);
        }
      }
    }

    frontier = nextFrontier;
  }

  return Array.from(all.values()).sort((a, b) => b.confidence - a.confidence);
}

// ─── Cluster → NodeBlueprint ──────────────────────────────────────────────────

export function clusterToBlueprint(cluster: SemanticCluster): NodeBlueprint {
  const slug = cluster.expansion.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    niche:        cluster.expansion,
    domain:       `den-${slug}.com`,
    baseStrategy: cluster.confidence >= 0.85 ? "revenue_optimised" : "hybrid_balanced",
    cloneOf:      null,
    sourceSignal: "adjacency",
    confidence:   cluster.confidence,
  };
}

// ─── Main function ────────────────────────────────────────────────────────────

export function generateSemanticExpansions(
  activeNiches:   string[],
  existingNiches: string[],
  limit:          number = 5
): NodeBlueprint[] {
  const clusters = expandMultiHop(activeNiches, existingNiches, 2);

  return clusters
    .slice(0, limit)
    .map(clusterToBlueprint);
}
