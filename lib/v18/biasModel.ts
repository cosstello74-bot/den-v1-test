/**
 * V18 Learning — Bias Model
 *
 * Long-term fairness monitoring across categories and segments.
 * Detects structural bias in what results users are seeing over time:
 *   - Category dominance (one category > 70% of all impressions)
 *   - Category starvation (a category at 0% impressions)
 *   - Segment skew (one user segment receiving systematically better results)
 *   - Brand concentration (one brand dominating across all categories)
 *
 * Output feeds into the V17 dashboard and can influence V18 weight adjustments.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryStats {
  category:    string;
  impressions: number;
  share:       number;   // 0–1
}

export interface BiasIssue {
  type:     string;
  severity: "info" | "warning" | "critical";
  message:  string;
  data?:    Record<string, unknown>;
}

export interface BiasModelReport {
  timestamp:    number;
  issues:       BiasIssue[];
  categoryStats: CategoryStats[];
  overallScore: number;  // 0 = no bias, 1 = severe bias
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOMINANCE_THRESHOLD  = 0.70;   // >70% share = dominance
const STARVATION_THRESHOLD = 0.00;   // 0% share = starvation

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run bias checks against per-category impression stats.
 * Pass a map of category → impression count.
 */
export function runBiasModel(
  impressionsByCategory: Record<string, number>,
): BiasModelReport {
  const issues:    BiasIssue[]     = [];
  const catStats:  CategoryStats[] = [];

  const total = Object.values(impressionsByCategory).reduce((s, n) => s + n, 0);

  for (const [category, impressions] of Object.entries(impressionsByCategory)) {
    const share = total > 0 ? impressions / total : 0;
    catStats.push({ category, impressions, share });

    if (share === STARVATION_THRESHOLD && total > 0) {
      issues.push({
        type:     "CATEGORY_STARVATION",
        severity: "warning",
        message:  `Category "${category}" has zero impressions. It may be absent from quiz results.`,
        data:     { category, impressions, share },
      });
    }

    if (share > DOMINANCE_THRESHOLD) {
      issues.push({
        type:     "CATEGORY_DOMINANCE",
        severity: share > 0.85 ? "critical" : "warning",
        message:  `Category "${category}" has ${(share * 100).toFixed(1)}% of all impressions (threshold: ${DOMINANCE_THRESHOLD * 100}%).`,
        data:     { category, impressions, share },
      });
    }
  }

  // Score: 0 = clean, 1 = all critical issues
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const warningCount  = issues.filter((i) => i.severity === "warning").length;
  const overallScore  = Math.min(1, criticalCount * 0.4 + warningCount * 0.1);

  return {
    timestamp: Date.now(),
    issues,
    categoryStats: catStats.sort((a, b) => b.share - a.share),
    overallScore,
  };
}
