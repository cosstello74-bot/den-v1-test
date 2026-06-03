import type { Event } from "@/types/event";

export type ProductRevenueData = {
  affiliatePayout:      number;
  totalRevenue:         number;
  clickToRevenueRatio:  number;
  conversionRate:       number;
  revenueTrend:         "rising" | "stable" | "declining";
};

export type CategoryRevenueData = {
  revenuePerSession:  number;
  avgAffiliatePayout: number;
  totalRevenue:       number;
};

export type RevenueModelSnapshot = {
  generatedAt: string;
  products:    Record<string, ProductRevenueData>;
  categories:  Record<string, CategoryRevenueData>;
};

export type SessionRevenueMetrics = {
  sessionId:         string;
  totalRPS:          number;
  productContributions: Record<string, number>;
  affiliateClicks:   number;
  estimatedRevenue:  number;
};

/**
 * Revenue Per Session = sum of (affiliate click value × estimated conversion probability)
 * for every affiliate_clicked event in the session.
 */
export function calculateSessionRPS(
  events: Event[],
  revenueModel: RevenueModelSnapshot
): SessionRevenueMetrics {
  const affiliateClicks = events.filter((e) => e.type === "affiliate_clicked");

  let totalRPS = 0;
  const productContributions: Record<string, number> = {};

  for (const e of affiliateClicks) {
    const pid  = e.productId;
    if (!pid) continue;
    const data = revenueModel.products[pid];
    if (!data) continue;

    const contribution = data.affiliatePayout * data.conversionRate;
    totalRPS += contribution;
    productContributions[pid] = (productContributions[pid] ?? 0) + contribution;
  }

  const confirmedRevenue = events
    .filter((e) => e.type === "conversion_confirmed")
    .reduce((sum, e) => {
      const pid  = e.productId;
      const data = pid ? revenueModel.products[pid] : undefined;
      return sum + (data?.affiliatePayout ?? 0);
    }, 0);

  const sessionIds = Array.from(new Set(events.map((e) => e.sessionId)));
  const sessionId  = sessionIds.length === 1 ? sessionIds[0] : "mixed";

  return {
    sessionId,
    totalRPS:             Math.round(totalRPS * 100) / 100,
    productContributions,
    affiliateClicks:      affiliateClicks.length,
    estimatedRevenue:     Math.round(confirmedRevenue * 100) / 100,
  };
}
