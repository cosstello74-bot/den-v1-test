import { getRecommendations } from "./recommendByCategory";
import type { TrackingEvent, Recommendation } from "@/types/product";

// Backward-compatible wrapper — defaults to laptops category
export function getTopRecommendations(
  params: Record<string, string>,
  events: TrackingEvent[],
  count = 3
): Recommendation[] {
  return getRecommendations("laptops", params, events, undefined, undefined, count);
}
