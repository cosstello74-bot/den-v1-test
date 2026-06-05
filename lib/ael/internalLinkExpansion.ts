/**
 * v4 Internal Link Expansion Engine.
 *
 * Automatically connects AEL-generated pages into the site link graph.
 *
 * Rules per generated page:
 *   - Link to parent category page
 *   - Link to 2 most similar sibling pages (scored by category + intent + keyword overlap)
 *   - Derive intent-prefilled quiz href
 *
 * Outputs ExpandedLinkConfig[] — one per generated page.
 * Also outputs a flat link map (slug → { quizHref, related[] }) for JSON serialisation.
 */

import type { InternalLink, PageLinkConfig } from "@/lib/seo/internalLinks";
import type { GeneratedPageConfig }          from "./pageGenerator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExpandedLinkConfig = PageLinkConfig & {
  source: "generated" | "manual";
};

export type LinkMap = Record<string, {
  quizHref: string;
  related:  InternalLink[];
}>;

// ─── Intent → quiz intent param ───────────────────────────────────────────────

const INTENT_PARAM: Record<string, string> = {
  gaming_budget:          "gaming",
  gaming_mid:             "gaming",
  gaming_high:            "gaming",
  gaming_premium:         "gaming",
  gaming_any:             "gaming",
  student_value:          "student",
  student_budget:         "student",
  student_any:            "student",
  developer_professional: "coding",
  professional_budget:    "work",
  professional_mid:       "work",
  professional_high:      "work",
  professional_premium:   "work",
  professional_any:       "work",
  travel_portable:        "wfh",
  creative_professional:  "creative",
  creative_budget:        "creative",
  creative_mid:           "creative",
  creative_high:          "creative",
  creative_premium:       "creative",
  creative_any:           "creative",
  budget_general:         "budget",
  budget_any:             "budget",
  premium_professional:   "work",
};

function buildQuizHref(intent: string, category: string): string {
  const param = INTENT_PARAM[intent];
  const base  = `/quiz?category=${category}`;
  return param ? `${base}&intent=${param}` : base;
}

// ─── Category parent links ────────────────────────────────────────────────────

const CATEGORY_PARENT_LINKS: Record<string, InternalLink> = {
  laptops: {
    slug:        "laptops",
    href:        "/laptops",
    title:       "All Laptop Rankings",
    description: "Full laptop category — all use cases and segments ranked",
  },
  phones: {
    slug:        "phones",
    href:        "/phones",
    title:       "All Phone Rankings",
    description: "Full phone category — all use cases ranked",
  },
  monitors: {
    slug:        "monitors",
    href:        "/monitors",
    title:       "All Monitor Rankings",
    description: "Full monitor category — all segments ranked",
  },
  tablets: {
    slug:        "tablets",
    href:        "/tablets",
    title:       "All Tablet Rankings",
    description: "Full tablet category — all use cases ranked",
  },
  pcs: {
    slug:        "pcs",
    href:        "/pcs",
    title:       "All Desktop PC Rankings",
    description: "Full desktop PC category — all segments ranked",
  },
};

// ─── Topic cluster map ────────────────────────────────────────────────────────
// Pages in the same cluster get a bonus score as siblings.

const TOPIC_CLUSTERS: Record<string, string[]> = {
  gaming:     ["gaming_budget", "gaming_mid", "gaming_high", "gaming_premium", "gaming_any", "gaming_monitor", "gaming_pc", "gaming_phone"],
  student:    ["student_value", "student_budget", "student_any", "student_tablet", "budget_general"],
  creative:   ["creative_budget", "creative_mid", "creative_high", "creative_premium", "creative_any", "creative_professional", "creative_monitor"],
  budget:     ["budget_general", "budget_any", "student_budget", "student_value", "professional_budget", "creative_budget", "gaming_budget"],
  work:       ["professional_budget", "professional_mid", "professional_high", "professional_premium", "professional_any", "premium_professional", "developer_professional", "travel_portable"],
  camera:     ["camera_phone", "camera_any"],
  battery:    ["battery_phone", "battery_any", "travel_portable"],
};

/** Returns the cluster name for a given intent, or null. */
function getCluster(intent: string): string | null {
  for (const [cluster, intents] of Object.entries(TOPIC_CLUSTERS)) {
    if (intents.includes(intent)) return cluster;
  }
  return null;
}

// ─── Sibling scoring ──────────────────────────────────────────────────────────
/**
 * Score relevance between source and candidate for sibling link selection.
 * Higher score = more relevant sibling.
 */
function siblingRelevanceScore(
  source: GeneratedPageConfig,
  candidate: GeneratedPageConfig
): number {
  if (source.slug === candidate.slug) return -Infinity;

  const sourceIntent    = String(source.intent    ?? "");
  const candidateIntent = String(candidate.intent ?? "");
  const sourceSlug      = String(source.slug      ?? "");
  const candidateSlug   = String(candidate.slug   ?? "");

  let score = 0;

  // Same category: strong signal
  if (source.category === candidate.category) score += 10;

  // Shared intent prefix (e.g. "gaming_*" → "gaming")
  const srcPrefix = sourceIntent.split("_")[0];
  const cndPrefix = candidateIntent.split("_")[0];
  if (srcPrefix && srcPrefix === cndPrefix) score += 5;

  // Same topic cluster: bonus
  const srcCluster = getCluster(sourceIntent);
  const cndCluster = getCluster(candidateIntent);
  if (srcCluster && srcCluster === cndCluster) score += 4;

  // Keyword overlap in slugs
  const srcParts = new Set(sourceSlug.split("-"));
  const overlap  = candidateSlug.split("-").filter((p) => srcParts.has(p)).length;
  score += overlap;

  return score;
}

// ─── v3 manual page registry ─────────────────────────────────────────────────
// Used as sibling candidates when no generated siblings are available.

const V3_MANUAL_PAGES: InternalLink[] = [
  { slug: "best-laptops-for-gaming",   href: "/best-laptops-for-gaming",   title: "Best Laptops for Gaming",   description: "GPU-focused performance rankings" },
  { slug: "best-laptops-for-students", href: "/best-laptops-for-students", title: "Best Laptops for Students", description: "Value-first university rankings" },
  { slug: "best-budget-laptops",       href: "/best-budget-laptops",       title: "Best Budget Laptops",       description: "Maximum value at entry-level price points" },
  { slug: "laptops-for-coding",        href: "/laptops-for-coding",        title: "Best Laptops for Coding",   description: "Developer-optimised productivity picks" },
  { slug: "work-from-home-laptops",    href: "/work-from-home-laptops",    title: "Work-From-Home Laptops",    description: "Battery + productivity for remote use" },
];

// ─── Main functions ───────────────────────────────────────────────────────────

/**
 * Build ExpandedLinkConfig[] for a batch of generated pages.
 * Each page gets: a quiz href, a parent category link, and up to 5 sibling links.
 */
export function buildExpandedLinks(
  newPages: GeneratedPageConfig[],
  allPages: GeneratedPageConfig[]   // includes previously generated pages
): ExpandedLinkConfig[] {
  return newPages.map((page): ExpandedLinkConfig => {
    const quizHref   = buildQuizHref(page.intent, page.category);
    const parentLink = CATEGORY_PARENT_LINKS[page.category];

    // Score all other pages as sibling candidates (same category or same cluster)
    const generatedSiblings = allPages
      .filter((p) => p.slug !== page.slug)
      .map((p) => ({ page: p, score: siblingRelevanceScore(page, p) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ page: p }): InternalLink => ({
        slug:        p.slug,
        href:        `/generated/${p.slug}`,
        title:       p.h1,
        description: (p.description.length > 85
          ? p.description.slice(0, 82) + "…"
          : p.description),
      }));

    // Fill remaining slots with v3 manual pages
    const usedSlugs  = new Set(generatedSiblings.map((s) => s.slug));
    const manualFill = V3_MANUAL_PAGES
      .filter((l) => !usedSlugs.has(l.slug))
      .slice(0, 5 - generatedSiblings.length);

    const related: InternalLink[] = [...generatedSiblings, ...manualFill].slice(0, 5);

    // Prepend parent category link
    if (parentLink && !related.find((r) => r.slug === parentLink.slug)) {
      related.unshift(parentLink);
    }

    return {
      slug:     page.slug,
      quizHref,
      related:  related.slice(0, 5),
      source:   "generated",
    };
  });
}

/**
 * Flatten ExpandedLinkConfig[] into a plain LinkMap for JSON serialisation.
 * Consumed at render time by the generated page route.
 */
export function buildLinkMap(configs: ExpandedLinkConfig[]): LinkMap {
  const map: LinkMap = {};
  for (const c of configs) {
    map[c.slug] = { quizHref: c.quizHref, related: c.related };
  }
  return map;
}

/**
 * Merge an existing LinkMap with new entries.
 * Existing entries are preserved; new entries are added.
 */
export function mergeLinkMaps(existing: LinkMap, additions: LinkMap): LinkMap {
  return { ...existing, ...additions };
}
