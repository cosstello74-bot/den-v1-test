import type { Event }               from "@/types/event";
import type { RevenueModelSnapshot } from "./metrics/revenueMetrics";
import fs from "fs";
import path from "path";

const REVENUE_MODEL_PATH = path.join(process.cwd(), "data", "revenueModel.json");
const LEARNING_RATE      = 0.1; // rolling-average weight for new observations

/**
 * Update the revenue model using new events.
 * Only `conversion_confirmed` and `affiliate_clicked` signals affect the model.
 * Uses exponential moving average: new = (1 - α) × old + α × observed.
 */
export function updateRevenueModel(
  events: Event[],
  baseline: RevenueModelSnapshot
): RevenueModelSnapshot {
  // Deep-clone products so we don't mutate the baseline
  const updatedProducts = JSON.parse(JSON.stringify(baseline.products)) as RevenueModelSnapshot["products"];

  // Tally affiliate clicks per product
  const clicksByProduct: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "affiliate_clicked" && e.productId) {
      clicksByProduct[e.productId] = (clicksByProduct[e.productId] ?? 0) + 1;
    }
  }

  // Tally conversions per product
  const conversionsByProduct: Record<string, number> = {};
  for (const e of events) {
    if (e.type === "conversion_confirmed" && e.productId) {
      conversionsByProduct[e.productId] = (conversionsByProduct[e.productId] ?? 0) + 1;
    }
  }

  // Update conversion rate via rolling average where we have both signals
  for (const [pid, clicks] of Object.entries(clicksByProduct)) {
    if (!updatedProducts[pid] || clicks === 0) continue;
    const conversions    = conversionsByProduct[pid] ?? 0;
    const observedRate   = conversions / clicks;
    const currentRate    = updatedProducts[pid].conversionRate;
    updatedProducts[pid].conversionRate =
      Math.round(((1 - LEARNING_RATE) * currentRate + LEARNING_RATE * observedRate) * 10000) / 10000;
  }

  // Re-derive clickToRevenueRatio from updated conversionRate × affiliatePayout
  for (const [pid, data] of Object.entries(updatedProducts)) {
    updatedProducts[pid].clickToRevenueRatio =
      Math.round(data.affiliatePayout * data.conversionRate * 100) / 100;
  }

  // Update trends based on shift direction
  for (const [pid, data] of Object.entries(updatedProducts)) {
    const baseline_rate = baseline.products[pid]?.conversionRate ?? data.conversionRate;
    const delta         = data.conversionRate - baseline_rate;
    if (delta > 0.005)        updatedProducts[pid].revenueTrend = "rising";
    else if (delta < -0.005)  updatedProducts[pid].revenueTrend = "declining";
    // else keep existing trend
  }

  return {
    generatedAt: new Date().toISOString(),
    products:    updatedProducts,
    categories:  baseline.categories,
  };
}

export function persistRevenueModel(model: RevenueModelSnapshot): void {
  try {
    fs.writeFileSync(REVENUE_MODEL_PATH, JSON.stringify(model, null, 2), "utf-8");
  } catch {
    // Vercel read-only FS — silently ignore
  }
}
