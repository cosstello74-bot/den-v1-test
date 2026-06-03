import { evaluateOutcome } from "./outcomeEngine";
import { correctBias } from "./biasCorrection";
import { getConfidenceWeight } from "./confidence";
import type { Event } from "@/types/event";

export type ProductTruth = {
  truth_score: number;        // [0, 1] — 0.5 neutral, 1.0 fully confirmed
  bias_corrected_ctr: number; // percentage, same scale as IntelligenceModel.weighted_ctr
  confidence: number;         // [0, 1] weight applied to scoring
  interaction_count: number;  // total outcome + exposure events observed
};

export type TruthModel = {
  generatedAt: string;
  products: Record<string, ProductTruth>;
};

export function buildTruthModel(events: Event[]): TruthModel {
  const outcomes = evaluateOutcome(events);
  const biasData  = correctBias(events);

  const allProductIds = new Set([
    ...Object.keys(outcomes),
    ...Object.keys(biasData),
  ]);

  const products: Record<string, ProductTruth> = {};

  for (const productId of Array.from(allProductIds)) {
    const outcome = outcomes[productId];
    const bias    = biasData[productId];

    const outcomeCount  = outcome?.interactionCount ?? 0;
    const exposureCount = bias?.exposure_count ?? 0;
    const totalCount    = outcomeCount + exposureCount;
    const confidence    = getConfidenceWeight(totalCount);

    products[productId] = {
      truth_score:        outcome?.truthScore      ?? 0.5,
      bias_corrected_ctr: bias?.bias_corrected_ctr ?? 0,
      confidence,
      interaction_count: totalCount,
    };
  }

  return { generatedAt: new Date().toISOString(), products };
}

export function mergeTruthModels(
  baseline: TruthModel,
  derived: TruthModel
): TruthModel {
  const merged = structuredClone(baseline);
  for (const [productId, truth] of Object.entries(derived.products)) {
    merged.products[productId] = truth;
  }
  merged.generatedAt = derived.generatedAt;
  return merged;
}
