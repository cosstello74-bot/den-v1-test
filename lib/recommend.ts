import { getRecommendations } from "./recommendByCategory";
import type { UserProfile, TrackingEvent, Recommendation } from "@/types/product";

// Backward-compatible wrapper — defaults to laptops category
export function getTopRecommendations(
  user: UserProfile,
  events: TrackingEvent[],
  count = 3
): Recommendation[] {
  return getRecommendations("laptops", user, events, undefined, undefined, count);
}
