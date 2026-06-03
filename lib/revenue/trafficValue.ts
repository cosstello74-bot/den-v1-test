/**
 * Phase 3 — Traffic value scoring.
 *
 * Maps traffic source → revenue multipliers and conversion probability
 * adjustments. Higher-intent sources (organic search) convert at higher
 * rates than social traffic.
 *
 * Used by the revenue engine to weight affiliate click value.
 */

import type { TrafficSourceLabel } from "@/lib/traffic/trafficSource";

// ─── Traffic → revenue parameters ────────────────────────────────────────────

export type TrafficRevenueParams = {
  /** Multiplier applied to base affiliate payout (0.5–1.5). */
  payoutMultiplier: number;
  /** Additive boost to conversion probability estimate (–0.02 to +0.05). */
  conversionBoost:  number;
  /** Intent quality label for display. */
  intentQuality:    "high" | "medium" | "low";
};

const TRAFFIC_VALUE_MAP: Record<TrafficSourceLabel, TrafficRevenueParams> = {
  google:   { payoutMultiplier: 1.40, conversionBoost:  0.04, intentQuality: "high"   },
  bing:     { payoutMultiplier: 1.25, conversionBoost:  0.03, intentQuality: "high"   },
  quora:    { payoutMultiplier: 1.15, conversionBoost:  0.02, intentQuality: "high"   },
  reddit:   { payoutMultiplier: 1.10, conversionBoost:  0.01, intentQuality: "medium" },
  email:    { payoutMultiplier: 1.10, conversionBoost:  0.01, intentQuality: "medium" },
  direct:   { payoutMultiplier: 1.00, conversionBoost:  0.00, intentQuality: "medium" },
  referral: { payoutMultiplier: 0.95, conversionBoost:  0.00, intentQuality: "medium" },
  youtube:  { payoutMultiplier: 0.95, conversionBoost: -0.01, intentQuality: "medium" },
  twitter:  { payoutMultiplier: 0.85, conversionBoost: -0.01, intentQuality: "low"    },
  facebook: { payoutMultiplier: 0.80, conversionBoost: -0.01, intentQuality: "low"    },
  tiktok:   { payoutMultiplier: 0.75, conversionBoost: -0.02, intentQuality: "low"    },
  unknown:  { payoutMultiplier: 0.85, conversionBoost: -0.01, intentQuality: "low"    },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getTrafficRevenueParams(source: TrafficSourceLabel | string): TrafficRevenueParams {
  return TRAFFIC_VALUE_MAP[source as TrafficSourceLabel] ?? TRAFFIC_VALUE_MAP.unknown;
}

/**
 * Compute adjusted affiliate payout given base payout and traffic source.
 */
export function adjustPayout(basePayout: number, source: TrafficSourceLabel | string): number {
  const params = getTrafficRevenueParams(source);
  return Math.round(basePayout * params.payoutMultiplier * 100) / 100;
}

/**
 * Compute adjusted conversion probability given base rate and traffic source.
 */
export function adjustConversionRate(baseRate: number, source: TrafficSourceLabel | string): number {
  const params = getTrafficRevenueParams(source);
  return Math.max(0, Math.min(1, baseRate + params.conversionBoost));
}

/**
 * Expected value per click = adjusted_payout × adjusted_conversion_rate.
 */
export function expectedValuePerClick(
  basePayout: number,
  baseConversionRate: number,
  source: TrafficSourceLabel | string
): number {
  const payout     = adjustPayout(basePayout, source);
  const conversion = adjustConversionRate(baseConversionRate, source);
  return Math.round(payout * conversion * 100) / 100;
}
