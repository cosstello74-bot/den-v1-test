import { getCategoryConfig } from "./category";

const STRENGTH_MIN_SCORE = 72;  // minimum dimension score to surface as a strength
const STRENGTH_BOOST     = 15;  // score boost when dimension matches user priority
import { calculateScore } from "./scoring";
import { getProductFeedback } from "./feedback";
import { updateProductWeights } from "./learning";
import { interpretParams } from "./v15/categoryScoring";
import type { Product, Recommendation, TrackingEvent } from "@/types/product";
import type { ScoringSignals } from "./v15/categoryScoring";
import type { IntelligenceModel } from "./learningEngine";
import type { TruthModel } from "./truthModel";
import seedIntelligence from "@/data/intelligenceModel.json";

// Bundled seed model — always available, updated at runtime by API
let runtimeIntelligence: IntelligenceModel = seedIntelligence as IntelligenceModel;

export function setRuntimeIntelligence(model: IntelligenceModel): void {
  runtimeIntelligence = model;
}

/**
 * V15: accepts raw input params (Record<string, string>) instead of UserProfile.
 * Category-native interpretation happens here in the scoring layer via
 * interpretParams(), keeping the input layer a pure passthrough.
 */
export function getRecommendations(
  category:     string,
  params:       Record<string, string>,
  events:       TrackingEvent[],
  intelligence?: IntelligenceModel,
  truthModel?:  TruthModel | null,
  count = 3
): Recommendation[] {
  const config         = getCategoryConfig(category);
  const products       = config.products as Product[];
  const scoringProfile = config.scoring_profile;
  const model          = intelligence ?? runtimeIntelligence;

  // Scoring layer responsibility: interpret raw params for this category
  const signals = interpretParams(params, category);

  // Personal learning: localStorage events → CTR feedback → dynamic_multiplier
  const feedback           = getProductFeedback(events);
  const productsWithMetrics = updateProductWeights(products, feedback);

  const scored = productsWithMetrics.map((product) => ({
    product,
    score: calculateScore(signals, product, model, scoringProfile, truthModel),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((item, index) => ({
    rank:     index + 1,
    score:    item.score,
    product:  item.product,
    strengths: deriveStrengths(item.product, signals, category),
  }));
}

const STRENGTH_LABEL_MAP: Record<string, { gaming: string; battery: string; portable: string; productivity: string; value: string }> = {
  software: {
    gaming:       "High Performance Score",
    battery:      "Efficient Licensing",
    portable:     "Cross-Platform Support",
    productivity: "High Productivity Rating",
    value:        "Exceptional Value for Money",
  },
  health: {
    gaming:       "High Effectiveness Score",
    battery:      "Sustained Energy",
    portable:     "Easy to Take",
    productivity: "Supports Wellness Goals",
    value:        "Exceptional Value for Money",
  },
  home: {
    gaming:       "High Power & Capacity",
    battery:      "Energy Efficient",
    portable:     "Compact & Easy to Use",
    productivity: "Excellent Performance",
    value:        "Exceptional Value for Money",
  },
};

const DEFAULT_STRENGTH_LABELS = {
  gaming:       "Excellent Gaming Performance",
  battery:      "Outstanding Battery Life",
  portable:     "Highly Portable Design",
  productivity: "High Productivity Rating",
  value:        "Exceptional Value for Money",
};

function deriveStrengths(
  product:  ReturnType<typeof updateProductWeights>[number],
  user:     ScoringSignals,
  category: string
): string[] {
  const labels = STRENGTH_LABEL_MAP[category] ?? DEFAULT_STRENGTH_LABELS;
  const candidates = [
    { key: "gaming",       label: labels.gaming,       value: product.gaming_score },
    { key: "battery",      label: labels.battery,      value: product.battery_score },
    { key: "portable",     label: labels.portable,     value: product.portability_score },
    { key: "productivity", label: labels.productivity, value: product.productivity_score },
    { key: "value",        label: labels.value,        value: product.value_score },
  ];

  const boosted = candidates.map((c) => {
    let boost = 0;
    if (c.key === "battery"      && user.battery_importance === "very-important")             boost = STRENGTH_BOOST;
    if (c.key === "portable"     && user.portability        === "frequently-travel")          boost = STRENGTH_BOOST;
    if (c.key === "gaming"       && user.purpose            === "gaming")                     boost = STRENGTH_BOOST;
    if (c.key === "productivity" && (user.purpose === "work" || user.purpose === "creative")) boost = STRENGTH_BOOST;
    if (c.key === "value"        && user.purpose            === "university")                 boost = STRENGTH_BOOST;
    return { ...c, sortValue: c.value + boost };
  });

  return boosted
    .filter((c) => c.value >= STRENGTH_MIN_SCORE)
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, 3)
    .map((c) => c.label);
}
