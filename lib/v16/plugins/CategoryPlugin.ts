/**
 * V16 Phase 1 — Category Plugin Interface & Registry
 *
 * Wraps v15 CATEGORY_SCORING_PROFILES in a typed plugin contract.
 * Each plugin exposes:
 *   extractFeatures() — maps raw input → ScoringSignals (delegates to v15 profile)
 *   validate()        — checks required fields are present; warns on missing
 *
 * NO behaviour change from v15. This layer adds structure, not new logic.
 * Exit condition: identical outputs to v15 interpretParams() for all categories.
 *
 * Architecture:
 *   getPlugin(category).extractFeatures(params)
 *     === interpretParams(params, category)     ← invariant
 */

import type { CategoryKey }         from "@/types/product";
import type { ScoringSignals }       from "../../v15/categoryScoring";
import { CATEGORY_SCORING_PROFILES } from "../../v15/categoryScoring";
import type { ValidationResult, FeatureVector } from "../types";

// ─── Plugin interface ─────────────────────────────────────────────────────────

export interface CategoryPlugin {
  /** Category this plugin handles. */
  id: CategoryKey;

  /**
   * Map raw input params → normalised feature vector (ScoringSignals).
   * Delegates to the v15 CategoryScoringProfile.interpret().
   * Conservative defaults apply for any missing fields.
   */
  extractFeatures(input: Record<string, string>): FeatureVector;

  /**
   * Validate raw input params against this category's required fields.
   * Returns valid=true only when all required fields are present.
   * Always returns warnings listing any missing fields so callers can log.
   */
  validate(input: Record<string, string>): ValidationResult;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function makePlugin(id: CategoryKey): CategoryPlugin {
  const profile = CATEGORY_SCORING_PROFILES[id];

  return {
    id,

    extractFeatures(input: Record<string, string>): ScoringSignals {
      return profile.interpret(input);
    },

    validate(input: Record<string, string>): ValidationResult {
      const missingFields: string[] = [];
      const warnings:      string[] = [];

      for (const field of profile.requiredFields) {
        if (!input[field]) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        warnings.push(
          `Category "${id}" quiz missing: ${missingFields.join(", ")}. Conservative defaults applied.`,
        );
      }

      return {
        valid: missingFields.length === 0,
        missingFields,
        warnings,
      };
    },
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CATEGORY_PLUGINS: Record<CategoryKey, CategoryPlugin> = {
  laptops:             makePlugin("laptops"),
  phones:              makePlugin("phones"),
  monitors:            makePlugin("monitors"),
  tablets:             makePlugin("tablets"),
  pcs:                 makePlugin("pcs"),
  health:              makePlugin("health"),
  "travel-insurance":  makePlugin("travel-insurance"),
  software:            makePlugin("software"),
};

/**
 * Get the plugin for a category string.
 * Falls back to the laptops plugin for unknown category values
 * (mirrors v15 interpretParams() fallback behaviour).
 */
export function getPlugin(category: string): CategoryPlugin {
  return CATEGORY_PLUGINS[category as CategoryKey] ?? CATEGORY_PLUGINS.laptops;
}
