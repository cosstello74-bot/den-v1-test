/**
 * Phase 5 — SEO meta builder.
 *
 * Centralised metadata factory for all DEN pages.
 * Produces Next.js Metadata objects with consistent:
 *   - title / description / keywords
 *   - canonical URL
 *   - Open Graph + Twitter Card
 *   - AI-indexing headers (GEO / AEO signals)
 */

import type { Metadata } from "next";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageType = "home" | "category" | "landing" | "generated" | "quiz" | "results";

export type MetaOptions = {
  title:          string;
  description:    string;
  /** Slug used to build the canonical URL, e.g. "best-laptops-for-gaming" */
  slug:           string;
  /** Display H1 (not used in Metadata but stored for reference) */
  h1?:            string;
  keywords?:      string[];
  /** Primary intent keyword surfaced to AI crawlers, e.g. "best gaming laptops" */
  intentKeyword?: string;
  pageType?:      PageType;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://den-v1.vercel.app";
const SITE_NAME  = "DEN — Decision Intelligence";
const GEO_COMMON = {
  "ai-indexing":      "enabled",
  "geo-entity-rich":  "true",
  "content-type":     "decision-intelligence",
  "ranking-method":   "truth-calibrated-composite",
  "bias-correction":  "position-weighted-ctr",
  "outcome-verified": "true",
} as const;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a fully-qualified Next.js Metadata object for any DEN page.
 */
export function buildMeta(opts: MetaOptions): Metadata {
  const canonical = opts.slug.startsWith("http")
    ? opts.slug
    : `${BASE_URL}/${opts.slug.replace(/^\//, "")}`;

  const keywords = Array.from(new Set([
    ...(opts.keywords ?? []),
    ...(opts.intentKeyword ? [opts.intentKeyword] : []),
    "DEN",
    "decision intelligence",
    "product rankings",
  ]));

  return {
    title:       opts.title,
    description: opts.description,
    keywords,
    alternates:  { canonical },
    openGraph: {
      title:       opts.title,
      description: opts.description,
      url:         canonical,
      type:        "website",
      siteName:    SITE_NAME,
    },
    twitter: {
      card:        "summary_large_image",
      title:       opts.title,
      description: opts.description,
    },
    other: {
      ...GEO_COMMON,
      "intent-keyword": opts.intentKeyword ?? "",
      "page-type":      opts.pageType ?? "landing",
    },
  };
}

/**
 * Convenience wrapper for category-root pages at /[slug].
 */
export function buildCategoryMeta(
  slug:        string,
  label:       string,
  description: string,
  keywords:    string[],
): Metadata {
  return buildMeta({
    title:         `Best ${label} — ${SITE_NAME}`,
    description,
    slug,
    keywords,
    intentKeyword: `best ${label.toLowerCase()}`,
    pageType:      "category",
  });
}

/**
 * Convenience wrapper for AEL-generated pages at /generated/[slug].
 */
export function buildGeneratedMeta(
  slug:          string,
  title:         string,
  description:   string,
  geoKeywords:   string[],
): Metadata {
  return buildMeta({
    title,
    description,
    slug:          `generated/${slug}`,
    keywords:      geoKeywords,
    intentKeyword: geoKeywords[0] ?? "",
    pageType:      "generated",
  });
}
