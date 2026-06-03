import type { Product, CategoryKey } from "@/types/product";
import type { GeneratedPageConfig }  from "./pageGenerator";
import type { FaqBlock }             from "@/lib/geo/geoContentEngine";
import {
  generateItemListSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  serializeSchemas,
} from "@/lib/geo/schemaGenerator";
import {
  extractEntities,
  extractEntityLabels,
  computeEntityDensity,
} from "@/lib/geo/entityExtractor";
import { evaluatePageGeoScore } from "@/lib/geo/geoScore";
import { generateGeoContent }   from "@/lib/geo/geoContentEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EnrichmentOutput = {
  summary:       string;
  entityLabels:  string[];
  faqBlocks:     FaqBlock[];
  jsonLd:        string;
  geoScore:      number;
  geoGrade:      "A" | "B" | "C" | "D";
  keywords:      string[];
};

// ─── Filter products for a generated page ────────────────────────────────────

export function filterProductsForPage(
  allProducts: Product[],
  page:        GeneratedPageConfig
): Product[] {
  const f = page.productFilter;

  let filtered = allProducts.filter((p) => {
    if (f.minGamingScore       !== undefined && p.gaming_score       < f.minGamingScore)       return false;
    if (f.minProductivityScore !== undefined && p.productivity_score < f.minProductivityScore) return false;
    if (f.minBatteryScore      !== undefined && p.battery_score      < f.minBatteryScore)      return false;
    if (f.minPortabilityScore  !== undefined && p.portability_score  < f.minPortabilityScore)  return false;
    if (f.minValueScore        !== undefined && p.value_score        < f.minValueScore)        return false;
    if (f.priceBands           !== undefined && !f.priceBands.includes(p.price_band))         return false;
    if (f.brands               !== undefined && !f.brands.includes(p.brand))                  return false;
    return true;
  });

  // Sort by intent-weighted composite score
  const w = page.intentWeights;
  filtered.sort((a, b) => {
    const scoreA =
      (a.gaming_score       * (w.gaming_score       ?? 0)) +
      (a.productivity_score * (w.productivity_score ?? 0)) +
      (a.battery_score      * (w.battery_score      ?? 0)) +
      (a.portability_score  * (w.portability_score  ?? 0)) +
      (a.value_score        * (w.value_score        ?? 0));
    const scoreB =
      (b.gaming_score       * (w.gaming_score       ?? 0)) +
      (b.productivity_score * (w.productivity_score ?? 0)) +
      (b.battery_score      * (w.battery_score      ?? 0)) +
      (b.portability_score  * (w.portability_score  ?? 0)) +
      (b.value_score        * (w.value_score        ?? 0));
    return scoreB - scoreA;
  });

  if (f.maxCount !== undefined) {
    filtered = filtered.slice(0, f.maxCount);
  }

  // Fallback: return top 5 from base category if no products match
  if (filtered.length === 0) {
    return allProducts.slice(0, 5);
  }

  return filtered;
}

// ─── Enrich a page config with GEO content ───────────────────────────────────

export function enrichPage(
  page:        GeneratedPageConfig,
  products:    Product[]
): EnrichmentOutput {
  const filtered = filterProductsForPage(products, page);
  const category = page.category as CategoryKey;

  const geoContent  = generateGeoContent(page.intent, category, filtered);
  const entities    = extractEntities(filtered, category);
  const geoScore    = evaluatePageGeoScore(geoContent, entities);
  const entityLabels = extractEntityLabels(filtered, category);

  const itemListSchema  = generateItemListSchema(filtered, category);
  const faqSchema       = generateFAQSchema(geoContent.faqBlocks);
  const breadcrumb      = generateBreadcrumbSchema(category);
  const jsonLd          = serializeSchemas(itemListSchema, faqSchema, breadcrumb);

  const keywords = Array.from(
    new Set([...page.geoKeywords, ...entityLabels.slice(0, 10)])
  );

  return {
    summary:      geoContent.summary,
    entityLabels,
    faqBlocks:    geoContent.faqBlocks,
    jsonLd,
    geoScore:     geoScore.total,
    geoGrade:     geoScore.grade,
    keywords,
  };
}

/**
 * Enrich a batch of page configs.
 * Returns a map of slug → EnrichmentOutput.
 */
export function enrichPageBatch(
  pages:    GeneratedPageConfig[],
  allProducts: Record<CategoryKey, Product[]>
): Record<string, EnrichmentOutput> {
  const result: Record<string, EnrichmentOutput> = {};
  for (const page of pages) {
    const products = allProducts[page.category] ?? [];
    result[page.slug] = enrichPage(page, products);
  }
  return result;
}
