import type { PageMetrics } from "./types";

export function scorePage(m: PageMetrics): number {
  return (
    m.revenue * 5 +
    m.conversions * 4 +
    m.dwellTime * 0.4 +
    m.clicks * 0.2 -
    m.bounceRate * 50
  );
}

export function classifyPages(metrics: PageMetrics[]) {
  const scored = metrics.map(m => ({
    m,
    score: scorePage(m),
  }));

  return {
    winners: scored.filter(x => x.score > 75).map(x => x.m),
    losers:  scored.filter(x => x.score < 30).map(x => x.m),
    neutral: scored.filter(x => x.score >= 30 && x.score <= 75).map(x => x.m),
  };
}

export function averageRevenueBySlug(metrics: PageMetrics[]) {
  const map = new Map<string, number>();

  for (const m of metrics) {
    map.set(m.slug, (map.get(m.slug) ?? 0) + m.revenue);
  }

  return map;
}

export function detectMomentum(metrics: PageMetrics[]) {
  return metrics.map(m => {
    const score =
      m.revenue * 2 +
      m.conversions * 3 -
      m.bounceRate * 50;

    return {
      slug:     m.slug,
      momentum: score > 80 ? "rising" : score < 30 ? "falling" : "stable",
    };
  });
}
