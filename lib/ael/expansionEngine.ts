import type { RevenueModelSnapshot } from "@/lib/metrics/revenueMetrics";
import type { CategoryKey }          from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OpportunityType =
  | "new_category"
  | "new_intent_page"
  | "revenue_fix"
  | "geo_coverage_gap"
  | "intent_gap";

export type EstimatedImpact = "high" | "medium" | "low";

export type ExpansionOpportunity = {
  id:               string;
  type:             OpportunityType;
  name:             string;
  category?:        string;
  confidence:       number; // 0-1
  rationale:        string;
  estimatedImpact:  EstimatedImpact;
  createdAt:        string;
  metadata:         Record<string, unknown>;
};

export type IntelligenceSnapshot = {
  products: Record<string, {
    global_ctr:         number;
    weighted_ctr:       number;
    trend:              string;
    segment_ctr:        Record<string, number>;
  }>;
};

export type ExpansionContext = {
  revenueModel:    RevenueModelSnapshot;
  intelligence:    IntelligenceSnapshot;
  existingPageSlugs: string[];
  existingCategoryIds: string[];
};

// ─── Thresholds ───────────────────────────────────────────────────────────────

const CONFIDENCE_THRESHOLD     = 0.85;
const HIGH_CTR_THRESHOLD       = 12.0;  // % — above average CTR signals demand
const LOW_CONVERSION_THRESHOLD = 0.055; // below category avg
const HIGH_PAYOUT_THRESHOLD    = 60;    // £
const CATEGORY_AVG_CONVERSION  = 0.074;

// ─── Intent vocabulary — used to detect coverage gaps ────────────────────────

const INTENT_VOCABULARY: Record<CategoryKey, Array<{
  slug: string; confidence: number; impact: EstimatedImpact; rationale: string;
}>> = {
  laptops: [
    { slug: "best-gaming-laptops-under-1000",  confidence: 0.92, impact: "high",   rationale: "Gaming segment CTR is 22% on top products. No mid-price gaming page." },
    { slug: "best-laptops-for-students",        confidence: 0.94, impact: "high",   rationale: "Student segment highest conversion bias (1.10×). No value-focused page." },
    { slug: "best-laptops-for-coding",          confidence: 0.90, impact: "high",   rationale: "Professional CTR 16-18% on productivity-optimised products." },
    { slug: "lightweight-laptops-for-travel",   confidence: 0.89, impact: "medium", rationale: "5 qualifying products. Travel segment under-served." },
    { slug: "best-laptops-for-video-editing",   confidence: 0.87, impact: "medium", rationale: "Creator segment CTR 22-25% on premium products. No creative intent page." },
    { slug: "best-budget-laptops-under-500",    confidence: 0.86, impact: "medium", rationale: "Budget products with value_score >= 85. Under-500 intent unserved." },
  ],
  phones: [
    { slug: "best-phones-for-photography",     confidence: 0.88, impact: "high",   rationale: "Camera intent unserved. Photography segment high conversion." },
    { slug: "best-battery-life-phones",         confidence: 0.86, impact: "medium", rationale: "Battery intent is a top search signal. No dedicated page." },
    { slug: "best-budget-smartphones",          confidence: 0.87, impact: "high",   rationale: "Budget segment largest volume. Value-focused phone page missing." },
  ],
  monitors: [
    { slug: "best-gaming-monitors",            confidence: 0.91, impact: "high",   rationale: "Gaming monitor intent is high volume. No dedicated page." },
    { slug: "best-monitors-for-video-editing", confidence: 0.87, impact: "medium", rationale: "Creative monitor intent unserved. 4K colour accuracy signals strong." },
    { slug: "best-budget-monitors",            confidence: 0.86, impact: "medium", rationale: "Budget monitor demand high. No value-focused page." },
  ],
  tablets: [
    { slug: "best-tablets-for-students",       confidence: 0.89, impact: "high",   rationale: "Education intent is primary tablet use case. No student page." },
    { slug: "best-tablets-for-drawing",        confidence: 0.87, impact: "medium", rationale: "Creative intent high in tablet segment. Stylus-capable products unserved." },
  ],
  pcs: [
    { slug: "best-gaming-pcs",                 confidence: 0.91, impact: "high",   rationale: "Gaming is primary desktop intent. No dedicated gaming PC page." },
    { slug: "best-pcs-for-video-editing",      confidence: 0.88, impact: "medium", rationale: "Creator segment for desktops unserved." },
  ],
  health: [
    { slug: "best-protein-powder-uk",              confidence: 0.90, impact: "high",   rationale: "Protein is the highest-volume supplement search intent. No dedicated page." },
    { slug: "best-vegan-supplements-uk",           confidence: 0.87, impact: "high",   rationale: "Vegan supplement intent growing rapidly. Linwoods organic range serves this." },
    { slug: "best-supplements-for-fitness",        confidence: 0.88, impact: "medium", rationale: "Fitness supplement intent unserved. Sci-Mx and Known Nutrition cover it." },
    { slug: "best-daily-vitamins-uk",              confidence: 0.86, impact: "medium", rationale: "General wellness supplement demand high. Known Nutrition multivitamin fits." },
  ],
  "travel-insurance": [
    { slug: "best-travel-insurance-uk",            confidence: 0.91, impact: "high",   rationale: "High-volume top-of-funnel intent. Coverwise single-trip and annual policies serve it." },
    { slug: "best-annual-travel-insurance-uk",     confidence: 0.89, impact: "high",   rationale: "Annual multi-trip intent is high value. Coverwise annual policies fit directly." },
    { slug: "cheap-travel-insurance-europe",       confidence: 0.88, impact: "high",   rationale: "Europe budget travel insurance is highest-volume sub-segment. Coverwise Europe plans." },
    { slug: "travel-insurance-adventure-sports-uk",confidence: 0.86, impact: "medium", rationale: "Adventure sports cover is an under-served intent with high engagement." },
  ],
  software: [
    { slug: "best-windows-11-licence-uk",          confidence: 0.92, impact: "high",   rationale: "Windows OS upgrade intent is very high volume. Mr Key Shop licences at 70–90% off retail." },
    { slug: "cheap-microsoft-office-licence-uk",   confidence: 0.91, impact: "high",   rationale: "Office suite licence buying intent is high. Office 2024 Home is top value play." },
    { slug: "best-antivirus-uk",                   confidence: 0.89, impact: "high",   rationale: "Antivirus intent unserved. Kaspersky Standard is top home recommendation." },
    { slug: "best-vpn-uk",                         confidence: 0.88, impact: "high",   rationale: "VPN intent growing. NordVPN and Surfshark are top value picks." },
  ],
  home: [
    { slug: "best-air-purifiers-uk",               confidence: 0.89, impact: "high",   rationale: "Air purifier intent high for allergy/asthma. Boxed2me HEPA units serve it." },
    { slug: "best-dehumidifiers-uk",               confidence: 0.88, impact: "high",   rationale: "Damp and condensation control is high-volume seasonal demand. Boxed2me compressor and Peltier units." },
    { slug: "best-air-fryers-uk",                  confidence: 0.90, impact: "high",   rationale: "Air fryer buying intent is very high volume. Boxed2me Nedis and Ex-Pro models cover budget to family." },
    { slug: "best-cordless-vacuums-uk",            confidence: 0.86, impact: "medium", rationale: "Cordless vacuum intent strong. Boxed2me Nedis stick and handheld units fit." },
  ],
};

// ─── Cluster vocabulary — used to detect new category opportunities ───────────

const CLUSTER_DEFINITIONS: Array<{
  id:         string;
  name:       string;
  baseCategory: CategoryKey;
  confidence: number;
  rationale:  string;
  impact:     EstimatedImpact;
}> = [
  { id: "ultrabooks",          name: "Ultrabooks",              baseCategory: "laptops",  confidence: 0.91, impact: "medium", rationale: "portability+battery cluster of 5 products" },
  { id: "budget-workhorses",   name: "Budget Workhorses",       baseCategory: "laptops",  confidence: 0.88, impact: "medium", rationale: "high value+productivity at budget/mid price" },
  { id: "performance-gaming",  name: "Performance Gaming",      baseCategory: "laptops",  confidence: 0.93, impact: "high",   rationale: "gaming_score >= 88 cluster of 3 products" },
  { id: "creator-workstations",name: "Creator Workstations",    baseCategory: "pcs",      confidence: 0.86, impact: "medium", rationale: "productivity-first desktop cluster" },
];

// ─── Main function ────────────────────────────────────────────────────────────

export function detectExpansionOpportunities(
  ctx: ExpansionContext
): ExpansionOpportunity[] {
  const opportunities: ExpansionOpportunity[] = [];
  const now = new Date().toISOString();

  // ── 1. Intent coverage gaps ───────────────────────────────────────────────

  for (const [category, intents] of Object.entries(INTENT_VOCABULARY) as [CategoryKey, typeof INTENT_VOCABULARY[CategoryKey]][]) {
    for (const intent of intents) {
      if (ctx.existingPageSlugs.includes(intent.slug)) continue;
      if (intent.confidence < CONFIDENCE_THRESHOLD) continue;

      opportunities.push({
        id:              `opp-intent-${intent.slug}`,
        type:            "new_intent_page",
        name:            intent.slug,
        category,
        confidence:      intent.confidence,
        rationale:       intent.rationale,
        estimatedImpact: intent.impact,
        createdAt:       now,
        metadata:        { category, intentVocabularySource: true },
      });
    }
  }

  // ── 2. Category cluster gaps ──────────────────────────────────────────────

  for (const cluster of CLUSTER_DEFINITIONS) {
    if (ctx.existingCategoryIds.includes(cluster.id)) continue;
    if (cluster.confidence < CONFIDENCE_THRESHOLD) continue;

    opportunities.push({
      id:              `opp-cat-${cluster.id}`,
      type:            "new_category",
      name:            cluster.id,
      category:        cluster.baseCategory,
      confidence:      cluster.confidence,
      rationale:       cluster.rationale,
      estimatedImpact: cluster.impact,
      createdAt:       now,
      metadata:        { clusterName: cluster.name, baseCategory: cluster.baseCategory },
    });
  }

  // ── 3. Revenue signals — high payout, low conversion ─────────────────────

  for (const [pid, data] of Object.entries(ctx.revenueModel.products)) {
    const isHighPayout     = data.affiliatePayout >= HIGH_PAYOUT_THRESHOLD;
    const isLowConversion  = data.conversionRate  <  LOW_CONVERSION_THRESHOLD;

    if (isHighPayout && isLowConversion) {
      const conf = 0.85 + Math.min((data.affiliatePayout - HIGH_PAYOUT_THRESHOLD) / 100, 0.10);
      if (conf < CONFIDENCE_THRESHOLD) continue;

      opportunities.push({
        id:              `opp-rev-${pid}`,
        type:            "revenue_fix",
        name:            `${pid}-conversion-optimisation`,
        confidence:      Math.round(conf * 100) / 100,
        rationale:       `${pid}: affiliate payout £${data.affiliatePayout} but conversion rate ${(data.conversionRate * 100).toFixed(1)}% — below category average ${(CATEGORY_AVG_CONVERSION * 100).toFixed(1)}%.`,
        estimatedImpact: data.affiliatePayout >= 80 ? "high" : "medium",
        createdAt:       now,
        metadata:        { productId: pid, conversionRate: data.conversionRate, affiliatePayout: data.affiliatePayout },
      });
    }
  }

  // ── 4. Intelligence signals — rising CTR, no dedicated page ───────────────

  for (const [pid, intel] of Object.entries(ctx.intelligence.products)) {
    if (intel.global_ctr < HIGH_CTR_THRESHOLD) continue;
    if (intel.trend !== "rising") continue;

    // Check if any existing page covers this product with specific intent
    const hasSpecificPage = ctx.existingPageSlugs.some((s) =>
      s.includes("creative") || s.includes("professional") || s.includes("premium")
    );

    if (!hasSpecificPage) {
      const conf = Math.min(0.85 + (intel.global_ctr - HIGH_CTR_THRESHOLD) / 50, 0.95);
      opportunities.push({
        id:              `opp-ctr-${pid}`,
        type:            "new_intent_page",
        name:            `high-performance-picks-${pid}`,
        confidence:      Math.round(conf * 100) / 100,
        rationale:       `${pid}: global CTR ${intel.global_ctr}% with rising trend. No intent page captures this demand.`,
        estimatedImpact: "medium",
        createdAt:       now,
        metadata:        { productId: pid, globalCtr: intel.global_ctr, trend: intel.trend },
      });
    }
  }

  // Sort by confidence × impact weight
  const impactWeight: Record<EstimatedImpact, number> = { high: 1.0, medium: 0.7, low: 0.4 };
  return opportunities
    .sort((a, b) =>
      (b.confidence * impactWeight[b.estimatedImpact]) -
      (a.confidence * impactWeight[a.estimatedImpact])
    )
    .slice(0, 20); // cap at 20 actionable opportunities
}
