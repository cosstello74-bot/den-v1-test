export type TrafficSource =
  | "organic_search"
  | "direct"
  | "social"
  | "paid_ads"
  | "referral"
  | "unknown";

const TRAFFIC_WEIGHTS: Record<TrafficSource, number> = {
  organic_search: 1.0,
  direct:         0.9,
  referral:       0.8,
  social:         0.7,
  paid_ads:       0.6,
  unknown:        0.85,
};

export function getTrafficWeight(source: TrafficSource | string): number {
  return TRAFFIC_WEIGHTS[source as TrafficSource] ?? TRAFFIC_WEIGHTS.unknown;
}
