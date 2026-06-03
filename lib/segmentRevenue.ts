import type { SegmentType } from "@/types/event";

export type SegmentRevenueProfile = {
  multiplier:    number;
  avgOrderValue: "low" | "medium" | "high" | "very_high";
  conversionBias: number; // relative conversion rate modifier vs baseline
  description:   string;
};

const SEGMENT_REVENUE_PROFILES: Record<SegmentType, SegmentRevenueProfile> = {
  student:      {
    multiplier:    0.70,
    avgOrderValue: "low",
    conversionBias: 1.10,
    description:   "Low AOV, high volume, price-sensitive",
  },
  gamer:        {
    multiplier:    1.00,
    avgOrderValue: "medium",
    conversionBias: 1.20,
    description:   "Medium AOV, high engagement, brand loyal",
  },
  professional: {
    multiplier:    1.30,
    avgOrderValue: "high",
    conversionBias: 1.15,
    description:   "High AOV, high conversion, budget available",
  },
  creator:      {
    multiplier:    1.15,
    avgOrderValue: "high",
    conversionBias: 1.05,
    description:   "Medium-high AOV, deliberate purchase behaviour",
  },
  general:      {
    multiplier:    0.90,
    avgOrderValue: "medium",
    conversionBias: 1.00,
    description:   "Baseline segment, mixed intent and budget",
  },
};

export function getSegmentRevenueMultiplier(segment: SegmentType | string): number {
  return SEGMENT_REVENUE_PROFILES[segment as SegmentType]?.multiplier ?? 0.90;
}

export function getSegmentRevenueProfile(segment: SegmentType | string): SegmentRevenueProfile {
  return SEGMENT_REVENUE_PROFILES[segment as SegmentType] ?? SEGMENT_REVENUE_PROFILES.general;
}

export { SEGMENT_REVENUE_PROFILES };
