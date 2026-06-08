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
    strengths: deriveStrengths(item.product, signals),
  }));
}

function deriveStrengths(
  product: ReturnType<typeof updateProductWeights>[number],
  user:    ScoringSignals
): string[] {
  const candidates = [
    { label: "Excellent Gaming Performance", value: product.gaming_score },
    { label: "Outstanding Battery Life",     value: product.battery_score },
    { label: "Highly Portable Design",       value: product.portability_score },
    { label: "High Productivity Rating",     value: product.productivity_score },
    { label: "Exceptional Value for Money",  value: product.value_score },
  ];

  const boosted = candidates.map((c) => {
    let boost = 0;
    if (c.label.includes("Battery")      && user.battery_importance === "very-important")    boost = STRENGTH_BOOST;
    if (c.label.includes("Portable")     && user.portability        === "frequently-travel") boost = STRENGTH_BOOST;
    if (c.label.includes("Gaming")       && user.purpose            === "gaming")            boost = STRENGTH_BOOST;
    if (c.label.includes("Productivity") && (user.purpose === "work" || user.purpose === "creative")) boost = STRENGTH_BOOST;
    if (c.label.includes("Value")        && user.purpose            === "university")        boost = STRENGTH_BOOST;
    return { ...c, sortValue: c.value + boost };
  });

  return boosted
    .filter((c) => c.value >= STRENGTH_MIN_SCORE)
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, 3)
    .map((c) => c.label);
}
