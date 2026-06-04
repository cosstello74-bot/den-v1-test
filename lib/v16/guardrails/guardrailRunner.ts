/**
 * V16 Guardrails — Runner
 *
 * runV16Guardrails() aggregates all guard checks and throws on the
 * first violation (fail-fast). Call after applyCompositeRanking()
 * when ENABLE_GUARDRAILS flag is true.
 *
 * In development / CI: throw on violation (surfaces bugs immediately).
 * In production: log violations, never throw (ranking must not crash).
 *
 * Usage:
 *   import { runV16Guardrails } from "@/lib/v16/guardrails/guardrailRunner";
 *   runV16Guardrails(ranked, category, params, { throwOnViolation: isDev });
 */

import type { RevenueEnrichedRecommendation, GuardrailViolation } from "../types";
import { checkRankingIntegrity }  from "./rankingGuards";
import { checkRevenueIsolation }  from "./revenueGuards";
import { runCategoryGuards }      from "./categoryGuards";
import { recordRankOutput }       from "./determinismGuards";

export interface GuardrailRunOptions {
  /** Throw on first violation. Default: true in dev, false in production. */
  throwOnViolation?: boolean;
  /** Include category plugin registry checks. Slightly more expensive. */
  checkRegistry?:    boolean;
}

export interface GuardrailRunResult {
  passed:     boolean;
  violations: GuardrailViolation[];
}

export function runV16Guardrails(
  ranked:   RevenueEnrichedRecommendation[],
  category: string,
  params:   Record<string, string>,
  options:  GuardrailRunOptions = {},
): GuardrailRunResult {
  const {
    throwOnViolation = process.env.NODE_ENV !== "production",
    checkRegistry    = false,
  } = options;

  const violations: GuardrailViolation[] = [];

  // 1. Revenue isolation: compositeScore === score for all recs
  violations.push(...checkRevenueIsolation(ranked));

  // 2. Ranking integrity: higher relevance score always ranks higher (outside epsilon)
  violations.push(...checkRankingIntegrity(ranked));

  // 3. Determinism: same input → same rank order
  const productIds    = ranked.map((r) => r.product.id);
  const detViolation  = recordRankOutput(category, params, productIds);
  if (detViolation) violations.push(detViolation);

  // 4. Category plugin registry (optional, one-time check)
  if (checkRegistry) {
    violations.push(...runCategoryGuards());
  }

  if (violations.length > 0) {
    if (throwOnViolation) {
      const first = violations[0];
      throw new Error(`[V16 Guardrail] ${first.rule}: ${first.message}`);
    }
    // Non-throwing: log + persist to Supabase via API route (fire-and-forget)
    for (const v of violations) {
      console.error(`[V16 Guardrail] ${v.rule}:`, v.message, v.data ?? "");
      if (typeof fetch !== "undefined") {
        void fetch("/api/v16/violations", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            rule:     v.rule,
            message:  v.message,
            category,
            data:     v.data,
          }),
        }).catch(() => { /* non-critical */ });
      }
    }
  }

  return { passed: violations.length === 0, violations };
}
