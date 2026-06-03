import type { GeoContent }  from "./geoContentEngine";
import type { Entity }       from "./entityExtractor";
import { computeEntityDensity } from "./entityExtractor";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeoScoreInput = {
  entityDensity:               number; // 0-100
  structuredDataCompleteness:  number; // 0-100
  comparisonDepth:             number; // 0-100
  faqCoverage:                 number; // 0-100
  clarityIndex:                number; // 0-100
};

export type GeoScoreBreakdown = GeoScoreInput & {
  total: number;
  grade: "A" | "B" | "C" | "D";
};

// ─── Weights ──────────────────────────────────────────────────────────────────

const WEIGHTS = {
  entityDensity:              0.25,
  structuredDataCompleteness: 0.25,
  comparisonDepth:            0.20,
  faqCoverage:                0.20,
  clarityIndex:               0.10,
};

// ─── Score computation ────────────────────────────────────────────────────────

export function computeGeoScore(input: GeoScoreInput): number {
  return Math.round(
    input.entityDensity              * WEIGHTS.entityDensity +
    input.structuredDataCompleteness * WEIGHTS.structuredDataCompleteness +
    input.comparisonDepth            * WEIGHTS.comparisonDepth +
    input.faqCoverage                * WEIGHTS.faqCoverage +
    input.clarityIndex               * WEIGHTS.clarityIndex
  );
}

function gradeFromScore(score: number): "A" | "B" | "C" | "D" {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

/**
 * Evaluate GEO score from a generated GeoContent and entity list.
 */
export function evaluatePageGeoScore(
  content:  GeoContent,
  entities: Entity[]
): GeoScoreBreakdown {
  // Entity density: normalised count of unique entities
  const entityDensity = computeEntityDensity(entities);

  // Structured data completeness: checks for required sections
  const sections = [
    content.summary.length > 100,                // summary block
    content.comparisonTable.length > 0,          // comparison table
    content.decisionLogic.length >= 3,           // decision logic
    content.entityList.length >= 5,              // entity panel
    content.faqBlocks.length >= 3,               // FAQ block
  ];
  const structuredDataCompleteness = Math.round((sections.filter(Boolean).length / sections.length) * 100);

  // Comparison depth: product count × attribute count, normalised
  const ATTRIBUTES_PER_ROW = 5; // product, brand, performance, battery, value
  const MAX_DEPTH = 12 * ATTRIBUTES_PER_ROW;
  const actualDepth = content.comparisonTable.length * ATTRIBUTES_PER_ROW;
  const comparisonDepth = Math.min(Math.round((actualDepth / MAX_DEPTH) * 100), 100);

  // FAQ coverage: FAQ count normalised against target of 6
  const faqCoverage = Math.min(Math.round((content.faqBlocks.length / 6) * 100), 100);

  // Clarity index: measures factual density via avg answer length and non-marketing content
  // Proxy: avg FAQ answer word count normalised against 80-word target
  const avgAnswerWords = content.faqBlocks.length > 0
    ? content.faqBlocks.reduce((sum, f) => sum + f.answer.split(/\s+/).length, 0) / content.faqBlocks.length
    : 0;
  const clarityIndex = Math.min(Math.round((avgAnswerWords / 80) * 100), 100);

  const input: GeoScoreInput = {
    entityDensity,
    structuredDataCompleteness,
    comparisonDepth,
    faqCoverage,
    clarityIndex,
  };

  const total = computeGeoScore(input);

  return { ...input, total, grade: gradeFromScore(total) };
}
