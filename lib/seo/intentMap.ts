/**
 * Phase 5 — SEO intent mapping.
 *
 * Maps user quiz answers → SEO landing page slugs.
 * Each intent entry defines:
 *   - the canonical slug (GEO/AEL page route)
 *   - matching quiz signals (purpose, budget, segment)
 *   - SEO title + description template
 *   - target keywords
 */

import type { CategoryKey }  from "@/types/product";
import type { UserProfile }  from "@/types/product";
import type { SegmentType }  from "@/types/event";
import { detectSegment }     from "@/lib/segment";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentPageMeta = {
  slug:        string;
  category:    CategoryKey;
  title:       string;
  description: string;
  keywords:    string[];
  h1:          string;
  canonical:   string; // /generated/{slug} or /{category}
};

export type IntentMatch = {
  page:       IntentPageMeta;
  confidence: number; // 0–1 — how well the user profile maps to this page
};

// ─── Intent map ───────────────────────────────────────────────────────────────

type IntentRule = {
  page:    IntentPageMeta;
  signals: {
    purpose?:  UserProfile["purpose"][];
    budget?:   UserProfile["budget"][];
    segment?:  SegmentType[];
    portability?: UserProfile["portability"][];
  };
  baseConfidence: number;
};

const INTENT_RULES: IntentRule[] = [

  // ── Laptops ────────────────────────────────────────────────────────────────

  {
    page: {
      slug:        "best-gaming-laptops-under-1000",
      category:    "laptops",
      title:       "Best Gaming Laptops Under £1000 — DEN",
      h1:          "Best Gaming Laptops Under £1000",
      description: "Truth-calibrated gaming laptop rankings at mid-range price points. Scored on GPU performance, thermal capability, and value.",
      keywords:    ["gaming laptop under 1000", "best budget gaming laptop", "mid-range gaming laptop 2024"],
      canonical:   "/generated/best-gaming-laptops-under-1000",
    },
    signals:        { purpose: ["gaming"], budget: ["500-1000"], segment: ["gamer"] },
    baseConfidence: 0.92,
  },

  {
    page: {
      slug:        "best-laptops-for-students",
      category:    "laptops",
      title:       "Best Laptops for Students — DEN",
      h1:          "Best Laptops for Students",
      description: "Ranked laptops for university and student use. Weighted on value, battery endurance, and portability.",
      keywords:    ["best student laptops", "university laptop", "cheap laptops for students"],
      canonical:   "/generated/best-laptops-for-students",
    },
    signals:        { purpose: ["university"], budget: ["under-500", "500-1000"], segment: ["student"] },
    baseConfidence: 0.94,
  },

  {
    page: {
      slug:        "best-laptops-for-coding",
      category:    "laptops",
      title:       "Best Laptops for Coding — DEN",
      h1:          "Best Laptops for Coding",
      description: "Developer-optimised rankings. Productivity-first with secondary weighting on battery and portability.",
      keywords:    ["best laptop for coding", "developer laptop", "programming laptop"],
      canonical:   "/generated/best-laptops-for-coding",
    },
    signals:        { purpose: ["work"], segment: ["professional"] },
    baseConfidence: 0.90,
  },

  {
    page: {
      slug:        "lightweight-laptops-for-travel",
      category:    "laptops",
      title:       "Best Lightweight Laptops for Travel — DEN",
      h1:          "Best Lightweight Laptops for Travel",
      description: "Portable laptops ranked on portability score and battery endurance. All-day battery, compact 13–14-inch form factors.",
      keywords:    ["lightweight laptop", "best travel laptop", "portable work laptop"],
      canonical:   "/generated/lightweight-laptops-for-travel",
    },
    signals:        { portability: ["frequently-travel"], segment: ["professional", "creator"] },
    baseConfidence: 0.88,
  },

  {
    page: {
      slug:        "best-laptops-for-video-editing",
      category:    "laptops",
      title:       "Best Laptops for Video Editing — DEN",
      h1:          "Best Laptops for Video Editing",
      description: "Creative-optimised laptop rankings. Productivity-first with secondary display quality and GPU performance weighting.",
      keywords:    ["best laptop for video editing", "creative laptop", "content creator laptop"],
      canonical:   "/generated/best-laptops-for-video-editing",
    },
    signals:        { purpose: ["creative"], segment: ["creator"] },
    baseConfidence: 0.87,
  },

  // Category root pages (non-generated) ──────────────────────────────────────

  {
    page: {
      slug:        "laptops",
      category:    "laptops",
      title:       "Best Laptops — DEN Decision Intelligence",
      h1:          "Best Laptops",
      description: "Truth-calibrated laptop rankings across all use cases. Outcome-verified, position-bias corrected, segment-aware.",
      keywords:    ["best laptops", "laptop rankings", "top laptops"],
      canonical:   "/laptops",
    },
    signals:        {},
    baseConfidence: 0.60, // fallback for any laptop query
  },

  {
    page: {
      slug:        "phones",
      category:    "phones",
      title:       "Best Smartphones — DEN Decision Intelligence",
      h1:          "Best Smartphones",
      description: "Truth-calibrated smartphone rankings. Scored on camera, battery, performance, and value.",
      keywords:    ["best smartphones", "phone rankings"],
      canonical:   "/phones",
    },
    signals:        {},
    baseConfidence: 0.60,
  },

  {
    page: {
      slug:        "monitors",
      category:    "monitors",
      title:       "Best Monitors — DEN Decision Intelligence",
      h1:          "Best Monitors",
      description: "Monitor rankings for gaming, creative work, and office productivity.",
      keywords:    ["best monitors", "monitor rankings"],
      canonical:   "/monitors",
    },
    signals:        {},
    baseConfidence: 0.60,
  },

];

// ─── Matching logic ───────────────────────────────────────────────────────────

function matchScore(rule: IntentRule, user: UserProfile): number {
  const segment = detectSegment(user.purpose);
  let boost = 0;

  if (rule.signals.purpose?.includes(user.purpose))                   boost += 0.25;
  if (rule.signals.budget?.includes(user.budget))                     boost += 0.15;
  if (rule.signals.segment?.includes(segment as SegmentType))         boost += 0.20;
  if (rule.signals.portability?.includes(user.portability))           boost += 0.15;

  // No signals = category fallback — always partially relevant
  if (Object.keys(rule.signals).length === 0) boost += 0.05;

  return Math.min(rule.baseConfidence + boost, 1.0);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return all intent pages sorted by match confidence for the given user profile.
 * Filters to the relevant category and above a minimum confidence threshold.
 */
export function matchIntentPages(
  user:     UserProfile,
  category: CategoryKey,
  minConfidence = 0.70
): IntentMatch[] {
  return INTENT_RULES
    .filter((r) => r.page.category === category)
    .map((r) => ({ page: r.page, confidence: matchScore(r, user) }))
    .filter((m) => m.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Return the single best-matching intent page for the user profile.
 * Falls back to the category root page.
 */
export function getBestIntentPage(
  user:     UserProfile,
  category: CategoryKey
): IntentPageMeta {
  const matches = matchIntentPages(user, category, 0.70);
  return matches[0]?.page ?? INTENT_RULES.find((r) => r.page.slug === category)!.page;
}

/**
 * Return SEO metadata for a slug.
 */
export function getIntentPageMeta(slug: string): IntentPageMeta | undefined {
  return INTENT_RULES.find((r) => r.page.slug === slug)?.page;
}

/**
 * All intent page slugs — used to generate sitemap entries.
 */
export function getAllIntentSlugs(): string[] {
  return INTENT_RULES.map((r) => r.page.slug);
}
