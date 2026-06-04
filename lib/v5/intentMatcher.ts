/**
 * V5 — Intent Matcher
 * Maps SEO page intent → category + product filter criteria.
 * Deterministic — same input always produces same output.
 */

import type { CategoryKey } from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

export type IntentKey = string;

export type IntentProfile = {
  intent:      IntentKey;
  category:    CategoryKey;
  scoreWeights: {
    gaming_score?:       number;
    productivity_score?: number;
    battery_score?:      number;
    portability_score?:  number;
    value_score?:        number;
  };
  minScores: {
    gaming_score?:       number;
    productivity_score?: number;
    battery_score?:      number;
    portability_score?:  number;
    value_score?:        number;
  };
  priceBands?: string[];
};

// ─── Intent registry ──────────────────────────────────────────────────────────

const INTENT_REGISTRY: Record<IntentKey, IntentProfile> = {
  gaming_budget: {
    intent:       "gaming_budget",
    category:     "laptops",
    scoreWeights: { gaming_score: 0.55, value_score: 0.25, productivity_score: 0.10, battery_score: 0.10 },
    minScores:    { gaming_score: 80 },
    priceBands:   ["mid", "budget"],
  },
  student_value: {
    intent:       "student_value",
    category:     "laptops",
    scoreWeights: { value_score: 0.40, battery_score: 0.25, portability_score: 0.20, productivity_score: 0.15 },
    minScores:    { value_score: 82 },
    priceBands:   ["budget", "mid"],
  },
  developer_professional: {
    intent:       "developer_professional",
    category:     "laptops",
    scoreWeights: { productivity_score: 0.50, battery_score: 0.20, portability_score: 0.15, value_score: 0.15 },
    minScores:    { productivity_score: 88 },
  },
  travel_portable: {
    intent:       "travel_portable",
    category:     "laptops",
    scoreWeights: { portability_score: 0.40, battery_score: 0.35, productivity_score: 0.15, value_score: 0.10 },
    minScores:    { portability_score: 80, battery_score: 80 },
  },
  creative_professional: {
    intent:       "creative_professional",
    category:     "laptops",
    scoreWeights: { productivity_score: 0.50, battery_score: 0.20, portability_score: 0.15, value_score: 0.15 },
    minScores:    { productivity_score: 90 },
    priceBands:   ["high", "premium"],
  },
  budget_general: {
    intent:       "budget_general",
    category:     "laptops",
    scoreWeights: { value_score: 0.50, productivity_score: 0.25, battery_score: 0.15, portability_score: 0.10 },
    minScores:    { value_score: 82 },
    priceBands:   ["budget"],
  },
  gaming_monitor: {
    intent:       "gaming_monitor",
    category:     "monitors",
    scoreWeights: { gaming_score: 0.60, value_score: 0.20, productivity_score: 0.20 },
    minScores:    {},
  },
  student_tablet: {
    intent:       "student_tablet",
    category:     "tablets",
    scoreWeights: { value_score: 0.45, battery_score: 0.30, productivity_score: 0.25 },
    minScores:    { value_score: 75 },
  },
  gaming_pc: {
    intent:       "gaming_pc",
    category:     "pcs",
    scoreWeights: { gaming_score: 0.60, value_score: 0.25, productivity_score: 0.15 },
    minScores:    { gaming_score: 80 },
  },
  camera_phone: {
    intent:       "camera_phone",
    category:     "phones",
    scoreWeights: { productivity_score: 0.40, value_score: 0.30, battery_score: 0.30 },
    minScores:    {},
  },
  battery_phone: {
    intent:       "battery_phone",
    category:     "phones",
    scoreWeights: { battery_score: 0.60, value_score: 0.25, portability_score: 0.15 },
    minScores:    { battery_score: 75 },
  },
  budget_phone: {
    intent:       "budget_phone",
    category:     "phones",
    scoreWeights: { value_score: 0.55, battery_score: 0.25, portability_score: 0.20 },
    minScores:    { value_score: 70 },
    priceBands:   ["budget"],
  },
};

// ─── Matcher functions ────────────────────────────────────────────────────────

export function getIntentProfile(intent: IntentKey): IntentProfile | undefined {
  return INTENT_REGISTRY[intent];
}

export function getIntentsForCategory(category: CategoryKey): IntentProfile[] {
  return Object.values(INTENT_REGISTRY).filter((p) => p.category === category);
}

export function getAllIntents(): IntentProfile[] {
  return Object.values(INTENT_REGISTRY);
}

export function intentExists(intent: IntentKey): boolean {
  return intent in INTENT_REGISTRY;
}
