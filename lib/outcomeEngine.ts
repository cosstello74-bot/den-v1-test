import { truthDecayWeight } from "./timeDecay";
import type { Event } from "@/types/event";

export type OutcomeResult = {
  positiveOutcomeScore: number;
  negativeOutcomeScore: number;
  truthScore: number;
  interactionCount: number;
};

// Truth score = time-weighted positive outcomes / total outcomes
// confirmations×1.0 + revisits×0.4 vs returns×0.6 + failures×0.3
export function evaluateOutcome(events: Event[]): Record<string, OutcomeResult> {
  const byProduct = new Map<string, Event[]>();
  for (const event of events) {
    if (!event.productId) continue;
    const existing = byProduct.get(event.productId) ?? [];
    existing.push(event);
    byProduct.set(event.productId, existing);
  }

  const results: Record<string, OutcomeResult> = {};

  for (const [productId, productEvents] of Array.from(byProduct.entries())) {
    const confirmations = productEvents.filter((e) => e.type === "conversion_confirmed");
    const revisits      = productEvents.filter((e) => e.type === "product_revisited");
    const returns       = productEvents.filter((e) => e.type === "product_returned");
    const failures      = productEvents.filter((e) => e.type === "conversion_failed");

    const positiveOutcomeScore =
      confirmations.reduce((s, e) => s + truthDecayWeight(e.timestamp) * 1.0, 0) +
      revisits.reduce((s, e) => s + truthDecayWeight(e.timestamp) * 0.4, 0);

    const negativeOutcomeScore =
      returns.reduce((s, e) => s + truthDecayWeight(e.timestamp) * 0.6, 0) +
      failures.reduce((s, e) => s + truthDecayWeight(e.timestamp) * 0.3, 0);

    const interactionCount =
      confirmations.length + revisits.length + returns.length + failures.length;

    // Normalise to [0, 1]: all-positive → 1.0, all-negative → 0.0, no data → 0.5
    const total = positiveOutcomeScore + negativeOutcomeScore;
    const truthScore = total === 0 ? 0.5 : positiveOutcomeScore / total;

    results[productId] = {
      positiveOutcomeScore,
      negativeOutcomeScore,
      truthScore,
      interactionCount,
    };
  }

  return results;
}
