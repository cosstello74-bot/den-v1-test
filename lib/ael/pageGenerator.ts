import type { CategoryKey }       from "@/types/product";
import type { ExpansionOpportunity } from "./expansionEngine";
import type { IntentSignal }       from "./intentDiscovery";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentWeights = {
  gaming_score?:       number;
  productivity_score?: number;
  battery_score?:      number;
  portability_score?:  number;
  value_score?:        number;
};

export type ProductFilter = {
  minGamingScore?:       number;
  minProductivityScore?: number;
  minBatteryScore?:      number;
  minPortabilityScore?:  number;
  minValueScore?:        number;
  priceBands?:           string[];
  brands?:               string[];
  maxCount?:             number;
};

export type GeneratedPageConfig = {
  slug:                    string;
  title:                   string;
  h1:                      string;
  intent:                  string;
  category:                CategoryKey;
  description:             string;
  productFilter:           ProductFilter;
  intentWeights:           IntentWeights;
  geoKeywords:             string[];
  confidence:              number;
  createdAt:               string;
  expansionOpportunityId:  string;
};

// ─── Intent → page spec templates ────────────────────────────────────────────

type PageTemplate = {
  title:         string;
  h1:            string;
  description:   string;
  productFilter: ProductFilter;
  intentWeights: IntentWeights;
  geoKeywords:   string[];
};

const INTENT_TEMPLATES: Record<string, PageTemplate> = {
  gaming_budget: {
    title:         "Best Gaming Laptops Under £1000",
    h1:            "Best Gaming Laptops Under £1000",
    description:   "Truth-calibrated ranking of gaming laptops at mid-range price points. Scored on gaming performance, thermal capability, and value.",
    productFilter: { minGamingScore: 80, priceBands: ["mid", "budget"], maxCount: 5 },
    intentWeights: { gaming_score: 0.55, value_score: 0.25, productivity_score: 0.10, battery_score: 0.10 },
    geoKeywords:   ["gaming laptops under 1000", "best budget gaming laptops", "mid-range gaming laptop"],
  },
  student_value: {
    title:         "Best Laptops for Students",
    h1:            "Best Laptops for Students",
    description:   "Ranked laptops for university and student use. Weighted on value score, battery endurance, and portability.",
    productFilter: { minValueScore: 82, priceBands: ["budget", "mid"], maxCount: 5 },
    intentWeights: { value_score: 0.40, battery_score: 0.25, portability_score: 0.20, productivity_score: 0.15 },
    geoKeywords:   ["best student laptops", "laptops for university", "cheap laptops for students"],
  },
  developer_professional: {
    title:         "Best Laptops for Coding and Software Development",
    h1:            "Best Laptops for Coding",
    description:   "Developer-optimised rankings. Scored on productivity, processing performance, display quality, and battery for long coding sessions.",
    productFilter: { minProductivityScore: 88, maxCount: 5 },
    intentWeights: { productivity_score: 0.50, battery_score: 0.20, portability_score: 0.15, value_score: 0.15 },
    geoKeywords:   ["best laptops for coding", "developer laptops", "programming laptops"],
  },
  travel_portable: {
    title:         "Best Lightweight Laptops for Travel",
    h1:            "Best Lightweight Laptops for Travel",
    description:   "Highly portable laptops ranked on portability and battery endurance. All-day battery, compact form factors.",
    productFilter: { minPortabilityScore: 80, minBatteryScore: 80, maxCount: 5 },
    intentWeights: { portability_score: 0.40, battery_score: 0.35, productivity_score: 0.15, value_score: 0.10 },
    geoKeywords:   ["lightweight laptops", "best travel laptops", "portable laptops for work"],
  },
  creative_professional: {
    title:         "Best Laptops for Video Editing and Creative Work",
    h1:            "Best Laptops for Video Editing",
    description:   "Creative-optimised laptop rankings. Scored on productivity, display quality, GPU performance, and sustained workload capability.",
    productFilter: { minProductivityScore: 90, priceBands: ["high", "premium"], maxCount: 5 },
    intentWeights: { productivity_score: 0.50, battery_score: 0.20, portability_score: 0.15, value_score: 0.15 },
    geoKeywords:   ["best laptops for video editing", "creative laptops", "laptops for content creators"],
  },
  budget_general: {
    title:         "Best Budget Laptops Under £500",
    h1:            "Best Budget Laptops Under £500",
    description:   "Budget-focused laptop rankings. All products in the budget price band ranked primarily on value score and everyday usability.",
    productFilter: { priceBands: ["budget"], minValueScore: 82, maxCount: 5 },
    intentWeights: { value_score: 0.50, productivity_score: 0.25, battery_score: 0.15, portability_score: 0.10 },
    geoKeywords:   ["budget laptops under 500", "cheap laptops", "affordable laptops"],
  },
  gaming_monitor: {
    title:         "Best Gaming Monitors",
    h1:            "Best Gaming Monitors",
    description:   "Gaming monitor rankings scored on refresh rate, response time, and panel quality. Outcome-verified for the gaming segment.",
    productFilter: { maxCount: 5 },
    intentWeights: { gaming_score: 0.60, value_score: 0.20, productivity_score: 0.20 },
    geoKeywords:   ["best gaming monitors", "144hz monitors", "1ms response monitor"],
  },
  student_tablet: {
    title:         "Best Tablets for Students",
    h1:            "Best Tablets for Students",
    description:   "Student-optimised tablet rankings. Scored on value, battery life, and note-taking capability.",
    productFilter: { minValueScore: 75, maxCount: 5 },
    intentWeights: { value_score: 0.45, battery_score: 0.30, productivity_score: 0.25 },
    geoKeywords:   ["best tablets for students", "student tablet", "iPad alternatives for students"],
  },
  gaming_pc: {
    title:         "Best Gaming PCs",
    h1:            "Best Gaming PCs",
    description:   "Gaming desktop rankings scored on GPU capability, CPU performance, and value-per-frame.",
    productFilter: { minGamingScore: 80, maxCount: 5 },
    intentWeights: { gaming_score: 0.60, value_score: 0.25, productivity_score: 0.15 },
    geoKeywords:   ["best gaming PCs", "gaming desktop", "gaming tower PC"],
  },
};

// ─── Fallback template generator ─────────────────────────────────────────────

function buildFallbackTemplate(intent: IntentSignal): PageTemplate {
  const titleLabel = intent.slug.replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  return {
    title:         titleLabel,
    h1:            titleLabel,
    description:   `Truth-calibrated ${intent.category} rankings for the ${intent.intent.replace(/_/g, " ")} use case. Scored across multiple dimensions, verified by outcome signals.`,
    productFilter: { maxCount: 5 },
    intentWeights: { productivity_score: 0.30, value_score: 0.25, battery_score: 0.20, portability_score: 0.15, gaming_score: 0.10 },
    geoKeywords:   [intent.slug.replace(/-/g, " "), intent.intent.replace(/_/g, " ")],
  };
}

// ─── Main functions ───────────────────────────────────────────────────────────

export function generatePageFromIntent(
  intent:   IntentSignal,
  opportunityId: string
): GeneratedPageConfig {
  const template = INTENT_TEMPLATES[intent.intent] ?? buildFallbackTemplate(intent);

  return {
    slug:                   intent.slug,
    title:                  template.title,
    h1:                     template.h1,
    intent:                 intent.intent,
    category:               intent.category,
    description:            template.description,
    productFilter:          template.productFilter,
    intentWeights:          template.intentWeights,
    geoKeywords:            template.geoKeywords,
    confidence:             intent.priority / 100,
    createdAt:              new Date().toISOString(),
    expansionOpportunityId: opportunityId,
  };
}

export function generatePageFromOpportunity(
  opp: ExpansionOpportunity
): GeneratedPageConfig | null {
  if (opp.type !== "new_intent_page") return null;

  // Derive intent key from name — strip product suffix patterns
  const intentKey = opp.name.replace(/-p\d+$/, "").replace(/-/g, "_");
  const template  = INTENT_TEMPLATES[intentKey];

  if (!template) return null;

  return {
    slug:                   opp.name,
    title:                  template.title,
    h1:                     template.h1,
    intent:                 intentKey,
    category:               (opp.category ?? "laptops") as CategoryKey,
    description:            template.description,
    productFilter:          template.productFilter,
    intentWeights:          template.intentWeights,
    geoKeywords:            template.geoKeywords,
    confidence:             opp.confidence,
    createdAt:              new Date().toISOString(),
    expansionOpportunityId: opp.id,
  };
}
