/**
 * V16 End-to-End Pipeline Integration Test
 *
 * Tests the complete pipeline:
 *   collectParams → interpretParams → calculateScore
 *     → applyMonetisation → rankProducts → runV16Guardrails
 *
 * Uses minimal in-memory fixtures — no network, no filesystem, no Supabase.
 */

import { collectParams }        from "@/lib/v15/inputLayer";
import { interpretParams }      from "@/lib/v15/categoryScoring";
import { calculateScore }       from "@/lib/scoring";
import { applyMonetisation }    from "@/lib/v16/monetisation/applyMonetisation";
import { rankProducts, TIEBREAK_EPSILON } from "@/lib/v16/ranking/pureRanker";
import { runV16Guardrails }     from "@/lib/v16/guardrails/guardrailRunner";
import { TIEBREAK_EPSILON as CONFIG_EPSILON } from "@/lib/v16/config";
import type { ProductWithMetrics, Recommendation } from "@/types/product";
import type { RevenueModelSnapshot }               from "@/lib/metrics/revenueMetrics";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProduct(overrides: Partial<ProductWithMetrics> = {}): ProductWithMetrics {
  return {
    id:                  "prod-a",
    name:                "Test Laptop A",
    category:            "laptops",
    affiliate_url:       "https://example.com/a",
    price_band:          "mid",
    battery_score:       70,
    portability_score:   65,
    gaming_score:        50,
    productivity_score:  80,
    value_score:         75,
    screen_size:         "15-16",
    brand:               "Lenovo",
    dynamic_multiplier:  1.0,
    impressions:         100,
    clicks:              5,
    ctr:                 0.05,
    ...overrides,
  };
}

const FIXTURE_PRODUCTS: ProductWithMetrics[] = [
  makeProduct({ id: "prod-a", productivity_score: 80, gaming_score: 40, value_score: 75 }),
  makeProduct({ id: "prod-b", productivity_score: 60, gaming_score: 70, value_score: 65, name: "Test Laptop B", brand: "ASUS" }),
  makeProduct({ id: "prod-c", productivity_score: 90, gaming_score: 30, value_score: 80, name: "Test Laptop C", brand: "Dell" }),
];

const FIXTURE_REVENUE: RevenueModelSnapshot = {
  products: {
    "prod-a": { affiliatePayout: 20, totalRevenue: 200, clickToRevenueRatio: 0.1, conversionRate: 0.03, revenueTrend: "stable" },
    "prod-b": { affiliatePayout: 35, totalRevenue: 350, clickToRevenueRatio: 0.15, conversionRate: 0.04, revenueTrend: "rising" },
    "prod-c": { affiliatePayout: 15, totalRevenue: 150, clickToRevenueRatio: 0.08, conversionRate: 0.02, revenueTrend: "declining" },
  },
  categories: {},
  generatedAt: new Date().toISOString(),
};

function makeRecs(signals: ReturnType<typeof interpretParams>): Recommendation[] {
  return FIXTURE_PRODUCTS.map((p, i) => ({
    rank:      i + 1,
    score:     calculateScore(signals, p, null, {}, null),
    product:   p,
    strengths: [],
  }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("V16 Pipeline — collectParams → guardrails", () => {

  it("collectParams preserves all URL params", () => {
    const sp = new URLSearchParams("purpose=work&budget=500-1000&brand_preference=Lenovo");
    const params = collectParams(sp);
    expect(params.purpose).toBe("work");
    expect(params.budget).toBe("500-1000");
    expect(params.brand_preference).toBe("Lenovo");
  });

  it("interpretParams produces valid ScoringSignals for laptops", () => {
    const sp     = new URLSearchParams("purpose=work&budget=500-1000");
    const params = collectParams(sp);
    const signals = interpretParams(params, "laptops");
    expect(signals.purpose).toBe("work");
    expect(typeof signals.battery_importance).toBe("string");
    expect(typeof signals.portability).toBe("string");
  });

  it("calculateScore returns a positive number for a valid product+signals", () => {
    const sp      = new URLSearchParams("purpose=work&budget=500-1000");
    const params  = collectParams(sp);
    const signals = interpretParams(params, "laptops");
    const score   = calculateScore(signals, FIXTURE_PRODUCTS[0], null, {}, null);
    expect(score).toBeGreaterThan(0);
  });

  it("applyMonetisation preserves .score and sets compositeScore === .score", () => {
    const sp      = new URLSearchParams("purpose=work&budget=500-1000");
    const params  = collectParams(sp);
    const signals = interpretParams(params, "laptops");
    const recs    = makeRecs(signals);
    const context = { user: signals, trafficSource: "direct" as const };

    const enriched = applyMonetisation(recs, FIXTURE_REVENUE, context);
    for (const r of enriched) {
      expect(r.compositeScore).toBe(r.score);
      expect(r.revenueScore).toBeGreaterThanOrEqual(0);
      expect(r.revenueScore).toBeLessThanOrEqual(100);
    }
  });

  it("rankProducts returns a new array (does not mutate input)", () => {
    const sp      = new URLSearchParams("purpose=work&budget=500-1000");
    const params  = collectParams(sp);
    const signals = interpretParams(params, "laptops");
    const recs    = makeRecs(signals);
    const context = { user: signals, trafficSource: "direct" as const };

    const enriched = applyMonetisation(recs, FIXTURE_REVENUE, context);
    const original  = [...enriched];
    const ranked    = rankProducts(enriched);

    // Input unchanged
    expect(enriched).toEqual(original);
    // Returns new array reference
    expect(ranked).not.toBe(enriched);
  });

  it("rankProducts: higher score product always ranks first (outside epsilon)", () => {
    const sp      = new URLSearchParams("purpose=work&budget=500-1000");
    const params  = collectParams(sp);
    const signals = interpretParams(params, "laptops");
    const recs    = makeRecs(signals);
    const context = { user: signals, trafficSource: "direct" as const };

    const enriched = applyMonetisation(recs, FIXTURE_REVENUE, context);
    const ranked   = rankProducts(enriched);

    for (let i = 0; i < ranked.length - 1; i++) {
      const a = ranked[i];
      const b = ranked[i + 1];
      const diff = a.score - b.score;
      // Outside epsilon: a must have higher or equal score
      if (Math.abs(diff) > TIEBREAK_EPSILON) {
        expect(a.score).toBeGreaterThan(b.score);
      }
    }
  });

  it("TIEBREAK_EPSILON is the same in config.ts and pureRanker.ts re-export", () => {
    expect(TIEBREAK_EPSILON).toBe(CONFIG_EPSILON);
    expect(TIEBREAK_EPSILON).toBe(3);
  });

  it("runV16Guardrails passes (no violations) on well-formed ranked results", () => {
    const sp      = new URLSearchParams("purpose=work&budget=500-1000");
    const params  = collectParams(sp);
    const signals = interpretParams(params, "laptops");
    const recs    = makeRecs(signals);
    const context = { user: signals, trafficSource: "direct" as const };

    const enriched = applyMonetisation(recs, FIXTURE_REVENUE, context);
    const ranked   = rankProducts(enriched);
    ranked.forEach((r, i) => { r.rank = i + 1; });

    const result = runV16Guardrails(ranked, "laptops", params, {
      throwOnViolation: true,
    });

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("full pipeline is idempotent: same params → same rank order", () => {
    const sp = new URLSearchParams("purpose=work&budget=500-1000&battery_importance=very-important");

    function runPipeline() {
      const params  = collectParams(sp);
      const signals = interpretParams(params, "laptops");
      const recs    = makeRecs(signals);
      const context = { user: signals, trafficSource: "direct" as const };
      const enriched = applyMonetisation(recs, FIXTURE_REVENUE, context);
      const ranked   = rankProducts(enriched);
      ranked.forEach((r, i) => { r.rank = i + 1; });
      return ranked.map((r) => r.product.id);
    }

    const run1 = runPipeline();
    const run2 = runPipeline();
    expect(run1).toEqual(run2);
  });

});
