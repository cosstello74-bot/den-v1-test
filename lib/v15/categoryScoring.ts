/**
 * V15 — Category Scoring Profiles
 *
 * Each category is a first-class scoring domain. This module owns all
 * category-native interpretation: mapping raw input params to the scoring
 * signals that calculateScore() consumes.
 *
 * Architecture rule: interpretation logic lives HERE, not in the input
 * layer (results/page.tsx) and not in the scoring math (scoring.ts).
 *
 * Per-category contract:
 *   requiredFields — params the quiz should have captured for this category
 *   interpret()    — derives ScoringSignals from the raw param dictionary
 */

import type { CategoryKey } from "@/types/product";

// ─── Output type ──────────────────────────────────────────────────────────────

/**
 * Normalised scoring context that calculateScore() accepts.
 * Field names intentionally mirror UserProfile so the scoring math
 * requires no changes; the layer boundary is enforced by type, not
 * by renaming every field.
 */
export type ScoringSignals = {
  purpose:            string;
  budget:             string;
  battery_importance: string;
  portability:        string;
  screen_size:        string;
  brand_preference:   string;
};

// ─── Conservative defaults ────────────────────────────────────────────────────

const DEFAULTS: ScoringSignals = {
  purpose:            "work",
  budget:             "500-1000",
  battery_importance: "somewhat-important",
  portability:        "occasionally-travel",
  screen_size:        "no-preference",
  brand_preference:   "no-preference",
};

// ─── Per-category profiles ────────────────────────────────────────────────────

export type CategoryScoringProfile = {
  /** Fields the quiz captures for this category. Missing = conservative default. */
  requiredFields: string[];
  /** Map raw input params → scoring signals. Category logic lives here. */
  interpret:      (params: Record<string, string>) => ScoringSignals;
};

const LAPTOP_PROFILE: CategoryScoringProfile = {
  requiredFields: ["purpose", "budget", "battery_importance", "portability", "screen_size", "brand_preference"],
  interpret: (p) => ({
    purpose:            p.purpose            ?? DEFAULTS.purpose,
    budget:             p.budget             ?? DEFAULTS.budget,
    battery_importance: p.battery_importance ?? DEFAULTS.battery_importance,
    portability:        p.portability        ?? DEFAULTS.portability,
    screen_size:        p.screen_size        ?? DEFAULTS.screen_size,
    brand_preference:   p.brand_preference   ?? DEFAULTS.brand_preference,
  }),
};

const PHONE_PROFILE: CategoryScoringProfile = {
  requiredFields: ["purpose", "budget", "os_preference", "battery_importance", "screen_size"],
  interpret: (p) => {
    // os_preference → brand match in scoring engine.
    // "ios" → Apple; "android" → no-preference (multi-brand, no single target).
    const os = p.os_preference ?? "";
    const brand = os === "ios" ? "Apple" : DEFAULTS.brand_preference;

    return {
      purpose:            p.purpose            ?? DEFAULTS.purpose,
      budget:             p.budget             ?? DEFAULTS.budget,
      battery_importance: p.battery_importance ?? DEFAULTS.battery_importance,
      portability:        DEFAULTS.portability, // not asked; not relevant to phone ranking
      screen_size:        p.screen_size        ?? DEFAULTS.screen_size,
      brand_preference:   brand,
    };
  },
};

const MONITOR_PROFILE: CategoryScoringProfile = {
  requiredFields: ["purpose", "budget", "resolution", "refresh_priority", "screen_size"],
  interpret: (p) => ({
    purpose:            p.purpose   ?? DEFAULTS.purpose,
    budget:             p.budget    ?? DEFAULTS.budget,
    // refresh_priority maps into battery_importance slot.
    // 240hz → very-important boosts gaming_score via scoring profile.
    // 144hz → somewhat-important. 60hz → not-important.
    battery_importance: refreshToBatterySlot(p.refresh_priority),
    portability:        DEFAULTS.portability,
    screen_size:        p.screen_size ?? DEFAULTS.screen_size,
    brand_preference:   DEFAULTS.brand_preference,
  }),
};

function refreshToBatterySlot(refresh: string | undefined): string {
  if (refresh === "240hz") return "very-important";
  if (refresh === "144hz") return "somewhat-important";
  return "not-important";
}

const TABLET_PROFILE: CategoryScoringProfile = {
  requiredFields: ["purpose", "budget", "os_preference", "stylus_needed", "portability"],
  interpret: (p) => {
    // iPadOS → Apple; other OS → no-preference.
    const os = p.os_preference ?? "";
    const brand = os === "ipados" ? "Apple" : DEFAULTS.brand_preference;

    return {
      purpose:            p.purpose    ?? DEFAULTS.purpose,
      budget:             p.budget     ?? DEFAULTS.budget,
      battery_importance: DEFAULTS.battery_importance,
      portability:        p.portability ?? DEFAULTS.portability,
      screen_size:        p.screen_size ?? DEFAULTS.screen_size,
      brand_preference:   brand,
    };
  },
};

const PC_PROFILE: CategoryScoringProfile = {
  requiredFields: ["purpose", "budget", "form_factor", "battery_importance"],
  interpret: (p) => ({
    purpose: p.purpose ?? DEFAULTS.purpose,
    budget:  p.budget  ?? DEFAULTS.budget,
    // PC quiz repurposes battery_importance for GPU priority.
    // very-important = top GPU → maps correctly to gaming_score weight in scoring.
    battery_importance: p.battery_importance ?? DEFAULTS.battery_importance,
    portability:        DEFAULTS.portability,
    screen_size:        DEFAULTS.screen_size,
    brand_preference:   DEFAULTS.brand_preference,
  }),
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CATEGORY_SCORING_PROFILES: Record<CategoryKey, CategoryScoringProfile> = {
  laptops:  LAPTOP_PROFILE,
  phones:   PHONE_PROFILE,
  monitors: MONITOR_PROFILE,
  tablets:  TABLET_PROFILE,
  pcs:      PC_PROFILE,
};

/**
 * Interpret raw input params for a given category.
 * Returns scoring signals ready for calculateScore().
 * Falls back to laptop profile for unknown categories.
 */
export function interpretParams(
  params:   Record<string, string>,
  category: string,
): ScoringSignals {
  const profile = CATEGORY_SCORING_PROFILES[category as CategoryKey] ?? LAPTOP_PROFILE;
  return profile.interpret(params);
}
