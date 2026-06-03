/**
 * Revenue types — monetisation data shapes.
 *
 * Canonical revenue interfaces used across the revenue engine,
 * learning loop, and admin dashboards.
 */

export type { RevenueProfile } from "@/types/product";

// ─── Revenue model ────────────────────────────────────────────────────────────

export type RevenueTrend = "rising" | "stable" | "declining";

/** Per-product revenue parameters stored in revenueModel.json. */
export interface ProductRevenueParams {
  productId:             string;
  affiliatePayout:       number;   // £ per conversion
  conversionRate:        number;   // 0–1, rolling average
  revenueTrend:          RevenueTrend;
  lastUpdated:           string;   // ISO
  sessionCount:          number;
  clickCount:            number;
}

/** Top-level revenue model persisted to disk. */
export interface RevenueModelFile {
  updatedAt: string;
  products:  Record<string, ProductRevenueParams>;
}

/** Output of the revenue scoring function for a single product. */
export interface RevenueScoreResult {
  productId:              string;
  revenueScore:           number;   // 0–100
  estimatedMonthlyValue:  number;   // £
  conversionProbability:  number;   // 0–1
  efficiency:             "high" | "medium" | "low";
}

/** Aggregated revenue view for the admin dashboard. */
export interface RevenueOverview {
  totalProducts:          number;
  avgRevenueScore:        number;
  topProductId:           string;
  estimatedMonthlyRevenue: number;
  highEfficiencyCount:    number;
}
