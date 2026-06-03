/**
 * Phase 7 — GEO engine facade.
 *
 * Single import surface for the full GEO layer:
 *   - structured content generation
 *   - entity extraction
 *   - schema (JSON-LD) generation
 *   - GEO quality scoring
 *   - client-side signal tracking
 *
 * Usage:
 *   import { generatePage, scoreGeoPage } from "@/lib/geo/geoEngine";
 */

// ─── Content generation ───────────────────────────────────────────────────────

export {
  generateGeoContent,
} from "./geoContentEngine";

export type {
  GeoContent,
  ComparisonRow,
  FaqBlock,
} from "./geoContentEngine";

// ─── Entity extraction ────────────────────────────────────────────────────────

export {
  extractEntities,
  extractEntityLabels,
  computeEntityDensity,
} from "./entityExtractor";

export type {
  Entity,
  EntityType,
} from "./entityExtractor";

// ─── Schema (JSON-LD) ─────────────────────────────────────────────────────────

export {
  generateItemListSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  serializeSchemas,
} from "./schemaGenerator";

// ─── GEO scoring ─────────────────────────────────────────────────────────────

export {
  computeGeoScore,
  evaluatePageGeoScore,
} from "./geoScore";

export type {
  GeoScoreInput,
  GeoScoreBreakdown,
} from "./geoScore";

// ─── Signal tracking ──────────────────────────────────────────────────────────

export {
  initScrollTracking,
  trackSectionEnter,
  trackSectionExit,
  trackComparisonTableView,
  trackFaqInteraction,
  trackQuizConversion,
  flushGeoSignal,
} from "./geoSignals";

// ─── Composite helpers ────────────────────────────────────────────────────────

import type { Product, CategoryKey }  from "@/types/product";
import { generateGeoContent }         from "./geoContentEngine";
import { extractEntities }            from "./entityExtractor";
import { evaluatePageGeoScore }       from "./geoScore";
import {
  generateItemListSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  serializeSchemas,
} from "./schemaGenerator";
import type { GeoScoreBreakdown }     from "./geoScore";
import type { GeoContent }            from "./geoContentEngine";

export type FullGeoOutput = {
  content:  GeoContent;
  geoScore: GeoScoreBreakdown;
  jsonLd:   string;
  keywords: string[];
};

/**
 * Generate all GEO artefacts for a page in a single call.
 */
export function generatePage(
  intent:   string,
  category: CategoryKey,
  products: Product[]
): FullGeoOutput {
  const content   = generateGeoContent(intent, category, products);
  const entities  = extractEntities(products, category);
  const geoScore  = evaluatePageGeoScore(content, entities);
  const keywords  = entities.map((e) => e.label).slice(0, 20);

  const jsonLd = serializeSchemas(
    generateItemListSchema(products, category),
    generateFAQSchema(content.faqBlocks),
    generateBreadcrumbSchema(category)
  );

  return { content, geoScore, jsonLd, keywords };
}
