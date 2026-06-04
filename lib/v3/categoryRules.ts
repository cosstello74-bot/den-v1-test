/**
 * V3 — Category Rules
 * Defines which attributes are required, optional, or forbidden per category.
 * Used to validate products before they enter the catalog.
 */

import type { CategoryKey } from "@/types/product";
import type { ProductSpec }  from "./productSchema";

// ─── Rule definition ──────────────────────────────────────────────────────────

export type ScoreKey =
  | "gaming_score"
  | "productivity_score"
  | "battery_score"
  | "portability_score"
  | "value_score";

export type CategoryRule = {
  category:       CategoryKey;
  requiredScores: ScoreKey[];
  optionalScores: ScoreKey[];
  minScores:      Partial<Record<ScoreKey, number>>;
  maxProducts:    number;
};

// ─── Rules table ─────────────────────────────────────────────────────────────

export const CATEGORY_RULES: Record<CategoryKey, CategoryRule> = {
  laptops: {
    category:       "laptops",
    requiredScores: ["productivity_score", "battery_score", "portability_score", "value_score"],
    optionalScores: ["gaming_score"],
    minScores:      { value_score: 50, productivity_score: 50 },
    maxProducts:    50,
  },
  phones: {
    category:       "phones",
    requiredScores: ["battery_score", "portability_score", "value_score"],
    optionalScores: ["gaming_score", "productivity_score"],
    minScores:      { battery_score: 50, portability_score: 60 },
    maxProducts:    40,
  },
  monitors: {
    category:       "monitors",
    requiredScores: ["productivity_score", "value_score"],
    optionalScores: ["gaming_score"],
    minScores:      { value_score: 40 },
    maxProducts:    30,
  },
  tablets: {
    category:       "tablets",
    requiredScores: ["battery_score", "portability_score", "value_score", "productivity_score"],
    optionalScores: ["gaming_score"],
    minScores:      { portability_score: 60 },
    maxProducts:    25,
  },
  pcs: {
    category:       "pcs",
    requiredScores: ["productivity_score", "value_score"],
    optionalScores: ["gaming_score"],
    minScores:      { productivity_score: 55 },
    maxProducts:    30,
  },
};

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidationResult = { valid: true } | { valid: false; reasons: string[] };

export function validateProduct(
  product: Record<string, unknown>,
  category: CategoryKey
): ValidationResult {
  const rule = CATEGORY_RULES[category];
  const reasons: string[] = [];

  for (const score of rule.requiredScores) {
    if (typeof product[score] !== "number") {
      reasons.push(`Missing required score: ${score}`);
    }
  }

  for (const [score, min] of Object.entries(rule.minScores)) {
    const val = product[score as ScoreKey];
    if (typeof val === "number" && val < min) {
      reasons.push(`${score} is ${val}, minimum is ${min}`);
    }
  }

  if (product["category"] !== category) {
    reasons.push(`Category mismatch: expected ${category}, got ${String(product["category"])}`);
  }

  return reasons.length === 0 ? { valid: true } : { valid: false, reasons };
}

export function specAllowedForCategory(spec: ProductSpec, category: CategoryKey): boolean {
  return spec.category === category;
}
