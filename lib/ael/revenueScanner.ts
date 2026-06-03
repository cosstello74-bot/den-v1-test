import type { RevenueModelSnapshot } from "@/lib/metrics/revenueMetrics";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScanIssueType =
  | "high_ctr_low_conversion"
  | "high_payout_low_traffic"
  | "declining_trend"
  | "missing_coverage"
  | "below_category_average";

export type ScanPriority = "urgent" | "medium" | "low";

export type RevenueScanResult = {
  productId:      string;
  issue:          ScanIssueType;
  currentMetrics: {
    conversionRate?:  number;
    affiliatePayout?: number;
    totalRevenue?:    number;
    revenueTrend?:    string;
  };
  suggestion:  string;
  priority:    ScanPriority;
  score:       number; // 0-100 urgency score
};

export type RevenueScanReport = {
  scannedAt:    string;
  totalScanned: number;
  issues:       RevenueScanResult[];
  summary: {
    urgent: number;
    medium: number;
    low:    number;
    estimatedMonthlyLoss: number; // rough estimate
  };
};

// ─── Thresholds ───────────────────────────────────────────────────────────────

const CATEGORY_AVG_CONVERSION  = 0.074;
const HIGH_PAYOUT_THRESHOLD    = 50;
const LOW_REVENUE_THRESHOLD    = 200; // total revenue below this = low traffic concern
const URGENT_CONV_THRESHOLD    = 0.05;
const MEDIUM_CONV_THRESHOLD    = 0.065;

// ─── Per-issue suggestion templates ──────────────────────────────────────────

function buildSuggestion(
  pid:   string,
  issue: ScanIssueType,
  data:  { conversionRate?: number; affiliatePayout?: number; totalRevenue?: number; revenueTrend?: string }
): string {
  switch (issue) {
    case "high_ctr_low_conversion":
      return `${pid}: conversion rate ${((data.conversionRate ?? 0) * 100).toFixed(1)}% is below category average. Review landing page copy and ensure segment-appropriate framing. Consider adding to a dedicated intent page.`;
    case "high_payout_low_traffic":
      return `${pid}: affiliate payout £${data.affiliatePayout} but low traffic (£${data.totalRevenue} total revenue). Add to relevant intent pages (professional/creative segments) to increase impressions.`;
    case "declining_trend":
      return `${pid}: revenue trend is declining. De-prioritise in general rankings but investigate whether a niche intent page could preserve conversion from remaining interested buyers.`;
    case "missing_coverage":
      return `${pid}: high payout (£${data.affiliatePayout}) but no dedicated intent page capturing premium segment traffic. Generate a professional/creator-focused landing page.`;
    case "below_category_average":
      return `${pid}: conversion rate ${((data.conversionRate ?? 0) * 100).toFixed(1)}% below category average ${(CATEGORY_AVG_CONVERSION * 100).toFixed(1)}%. Apply truth calibration recalibration and check position bias correction.`;
    default:
      return `Review ${pid} for performance issues.`;
  }
}

function urgencyScore(
  data:  { conversionRate?: number; affiliatePayout?: number; totalRevenue?: number },
  issue: ScanIssueType
): number {
  let score = 0;
  // Payout weight: high payout issues are more urgent
  score += Math.min((data.affiliatePayout ?? 0), 100) * 0.4;
  // Conversion distance from average
  const convDelta = CATEGORY_AVG_CONVERSION - (data.conversionRate ?? CATEGORY_AVG_CONVERSION);
  score += Math.min(convDelta * 1000, 30);
  // Revenue gap weight
  if (issue === "high_payout_low_traffic") score += 20;
  if (issue === "declining_trend") score += 10;
  return Math.min(Math.round(score), 100);
}

function derivePriority(score: number): ScanPriority {
  if (score >= 60) return "urgent";
  if (score >= 35) return "medium";
  return "low";
}

// ─── Main scanner ─────────────────────────────────────────────────────────────

export function scanRevenue(model: RevenueModelSnapshot): RevenueScanReport {
  const now    = new Date().toISOString();
  const issues: RevenueScanResult[] = [];

  for (const [pid, data] of Object.entries(model.products)) {
    const detectedIssues: ScanIssueType[] = [];

    // Rule 1: High payout, low conversion
    if (data.affiliatePayout >= HIGH_PAYOUT_THRESHOLD && data.conversionRate < CATEGORY_AVG_CONVERSION) {
      detectedIssues.push("high_payout_low_traffic");
    }

    // Rule 2: Below category average conversion
    if (data.conversionRate < MEDIUM_CONV_THRESHOLD) {
      detectedIssues.push("below_category_average");
    }

    // Rule 3: High conversion, low revenue (missing traffic)
    if (data.conversionRate > CATEGORY_AVG_CONVERSION && data.totalRevenue < LOW_REVENUE_THRESHOLD) {
      detectedIssues.push("high_ctr_low_conversion");
    }

    // Rule 4: Declining trend
    if (data.revenueTrend === "declining") {
      detectedIssues.push("declining_trend");
    }

    // Rule 5: Missing coverage (high payout, low total revenue)
    if (data.affiliatePayout >= HIGH_PAYOUT_THRESHOLD * 1.4 && data.totalRevenue < 400) {
      detectedIssues.push("missing_coverage");
    }

    // Take only the most critical issue per product
    const primaryIssue = detectedIssues[0];
    if (!primaryIssue) continue;

    const metrics = {
      conversionRate:  data.conversionRate,
      affiliatePayout: data.affiliatePayout,
      totalRevenue:    data.totalRevenue,
      revenueTrend:    data.revenueTrend,
    };

    const score = urgencyScore(metrics, primaryIssue);

    issues.push({
      productId:      pid,
      issue:          primaryIssue,
      currentMetrics: metrics,
      suggestion:     buildSuggestion(pid, primaryIssue, metrics),
      priority:       derivePriority(score),
      score,
    });
  }

  // Sort by urgency score
  issues.sort((a, b) => b.score - a.score);

  const urgentCount  = issues.filter((i) => i.priority === "urgent").length;
  const mediumCount  = issues.filter((i) => i.priority === "medium").length;
  const lowCount     = issues.filter((i) => i.priority === "low").length;

  // Rough monthly loss: sum of (payout × avgConvDelta × est monthly clicks = 50)
  const estMonthlyLoss = issues
    .filter((i) => i.priority === "urgent")
    .reduce((s, i) => {
      const convDelta = CATEGORY_AVG_CONVERSION - (i.currentMetrics.conversionRate ?? 0);
      return s + (i.currentMetrics.affiliatePayout ?? 0) * convDelta * 50;
    }, 0);

  return {
    scannedAt:    now,
    totalScanned: Object.keys(model.products).length,
    issues,
    summary: {
      urgent:               urgentCount,
      medium:               mediumCount,
      low:                  lowCount,
      estimatedMonthlyLoss: Math.round(estMonthlyLoss),
    },
  };
}
