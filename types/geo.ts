/**
 * GEO types — AI indexing and structured content data shapes.
 *
 * Defines the canonical interfaces for the GEO layer:
 * content generation, entity extraction, scoring, and signal tracking.
 */

// ─── Content ──────────────────────────────────────────────────────────────────

export interface GeoFaqItem {
  question: string;
  answer:   string;
}

export interface GeoComparisonRow {
  product:     string;
  brand:       string;
  performance: number;
  battery:     number;
  value:       number;
  useCase:     string;
  priceBand:   string;
}

export interface GeoPageContent {
  summary:          string;
  entityList:       string[];
  comparisonTable:  GeoComparisonRow[];
  decisionLogic:    string[];
  faqBlocks:        GeoFaqItem[];
}

// ─── Entity ───────────────────────────────────────────────────────────────────

export type GeoEntityType =
  | "product"
  | "brand"
  | "use-case"
  | "performance-attribute"
  | "price-segment";

export interface GeoEntity {
  label:   string;
  type:    GeoEntityType;
  weight?: number;  // 0–1 relevance weight
}

// ─── Score ────────────────────────────────────────────────────────────────────

export type GeoGrade = "A" | "B" | "C" | "D";

export interface GeoScoreBreakdown {
  total:                      number;   // 0–100
  grade:                      GeoGrade;
  entityDensity:              number;
  structuredDataCompleteness: number;
  comparisonDepth:            number;
  faqCoverage:                number;
  clarityIndex:               number;
}

// ─── Signals ──────────────────────────────────────────────────────────────────

export interface GeoSignalPayload {
  category:         string;
  scrollDepth:      number;   // 0–100
  sectionsVisited:  string[];
  comparisonViewed: boolean;
  faqInteractions:  number;
  dwellTime:        number;   // seconds
  timestamp:        number;
}
