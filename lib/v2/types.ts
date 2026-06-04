export type PageMetrics = {
  slug: string;

  impressions: number;
  clicks: number;

  avgPosition: number;

  dwellTime: number;   // seconds
  bounceRate: number;  // 0–1

  conversions: number;
  revenue: number;

  updatedAt: number;
};
