import type { Product, ProductWithMetrics } from "@/types/product";
import type { FeedbackMap } from "./feedback";

const DEFAULT_MULTIPLIER = 1.0;
const MAX_MULTIPLIER = 2.0;
const MIN_MULTIPLIER = 0.5;

export function updateProductWeights(
  products: Product[],
  feedback: FeedbackMap
): ProductWithMetrics[] {
  return products.map((product) => {
    const f = feedback[product.id];

    const impressions = f?.impressions ?? 0;
    const clicks = f?.clicks ?? 0;
    const ctr = f?.ctr ?? 0;

    let multiplier = DEFAULT_MULTIPLIER;

    if (impressions > 0) {
      if (ctr > 10) {
        multiplier = Math.min(DEFAULT_MULTIPLIER + 0.1, MAX_MULTIPLIER);
      } else if (ctr >= 5) {
        multiplier = Math.min(DEFAULT_MULTIPLIER + 0.05, MAX_MULTIPLIER);
      } else if (ctr < 2) {
        multiplier = Math.max(DEFAULT_MULTIPLIER - 0.1, MIN_MULTIPLIER);
      }
    }

    return {
      ...product,
      dynamic_multiplier: multiplier,
      impressions,
      clicks,
      ctr,
    };
  });
}
