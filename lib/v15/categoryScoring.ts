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

// ─── Health & Supplements ─────────────────────────────────────────────────────
//
// Score field remapping (data/categories/health.json):
//   gaming_score       → effectiveness / potency
//   battery_score      → ingredient quality / purity
//   productivity_score → scientific backing
//   portability_score  → ease of use / taste / format convenience
//   value_score        → price-quality ratio
//
// ScoringSignals slots repurposed for health:
//   purpose            ← goal    (fitness→gaming, general→work, weight→university, organic→creative)
//   battery_importance ← activity level (very-active→very-important, active→somewhat-important)
//   portability        ← activity level (very-active→frequently-travel, etc.)
//   brand_preference   ← dietary pref (vegan/natural→Linwoods)
//   screen_size        → always "no-preference" (format not surfaced in quiz v1)

const HEALTH_PROFILE: CategoryScoringProfile = {
  requiredFields: ["purpose", "budget", "dietary", "lifestyle"],
  interpret: (p) => {
    const goalMap: Record<string, string> = {
      fitness: "gaming",     // effectiveness (gaming_score) boosted
      general: "work",       // scientific backing (productivity_score) boosted
      weight:  "university", // value for money (value_score) boosted
      organic: "creative",   // ingredient quality emphasis
    };

    const budgetMap: Record<string, string> = {
      "under-20": "under-500",
      "20-40":    "500-1000",
      "40-60":    "1000-1500",
      "60+":      "1500+",
    };

    const activityToBattery: Record<string, string> = {
      "very-active": "very-important",
      "active":      "somewhat-important",
      "light":       "not-important",
      "sedentary":   "not-important",
    };

    const activityToPortability: Record<string, string> = {
      "very-active": "frequently-travel",
      "active":      "occasionally-travel",
      "light":       "desk-use",
      "sedentary":   "desk-use",
    };

    // vegan / natural users get Linwoods surfaced first (organic plant-based brand)
    const dietToBrand: Record<string, string> = {
      vegan:   "Linwoods",
      natural: "Linwoods",
    };

    return {
      purpose:            goalMap[p.purpose ?? ""]      ?? DEFAULTS.purpose,
      budget:             budgetMap[p.budget ?? ""]     ?? DEFAULTS.budget,
      battery_importance: activityToBattery[p.lifestyle ?? ""]    ?? DEFAULTS.battery_importance,
      portability:        activityToPortability[p.lifestyle ?? ""] ?? DEFAULTS.portability,
      screen_size:        "no-preference",
      brand_preference:   dietToBrand[p.dietary ?? ""] ?? DEFAULTS.brand_preference,
    };
  },
};

// ─── Travel Insurance ─────────────────────────────────────────────────────────
//
// Score field remapping (data/categories/travel-insurance.json):
//   gaming_score       → policy breadth / coverage comprehensiveness
//   battery_score      → medical coverage quality (most critical factor)
//   productivity_score → cancellation & disruption cover
//   portability_score  → ease of purchase and claim experience
//   value_score        → price-to-coverage ratio
//
// ScoringSignals slots repurposed for travel insurance:
//   purpose            ← trip_type  (single-trip→gaming, annual→work)
//   battery_importance ← activities (adventure→very-important, standard→somewhat-important)
//   screen_size        ← destination ("europe" or "worldwide" — matched directly to product.screen_size)
//   portability        → DEFAULTS.portability (not quiz-relevant)
//   brand_preference   → DEFAULTS.brand_preference (single provider, no differentiation)

const TRAVEL_INSURANCE_PROFILE: CategoryScoringProfile = {
  requiredFields: ["trip_type", "destination", "activities", "budget"],
  interpret: (p) => {
    const tripTypeMap: Record<string, string> = {
      "single-trip": "gaming",
      "annual":      "work",
    };

    const budgetMap: Record<string, string> = {
      "under-20": "under-500",
      "20-40":    "500-1000",
      "40-60":    "1000-1500",
      "60+":      "1500+",
    };

    const activitiesToCoverage: Record<string, string> = {
      "standard":  "somewhat-important",
      "adventure": "very-important",
      "extreme":   "very-important",
    };

    return {
      purpose:            tripTypeMap[p.trip_type ?? ""]      ?? DEFAULTS.purpose,
      budget:             budgetMap[p.budget ?? ""]           ?? DEFAULTS.budget,
      battery_importance: activitiesToCoverage[p.activities ?? ""] ?? DEFAULTS.battery_importance,
      portability:        DEFAULTS.portability,
      // destination maps directly so product.screen_size match bonus applies
      screen_size:        p.destination ?? DEFAULTS.screen_size,
      brand_preference:   DEFAULTS.brand_preference,
    };
  },
};

// ─── Software & Licences ──────────────────────────────────────────────────────
//
// Score field remapping (data/categories/software.json):
//   gaming_score       → performance / speed (OS compatibility, VPN throughput)
//   battery_score      → system efficiency (lightweight, low resource usage)
//   productivity_score → productivity / protection quality
//   portability_score  → multi-device / cross-platform support
//   value_score        → price-to-value ratio
//
// ScoringSignals slots repurposed for software:
//   purpose            ← software_type: os→"gaming", office→"work", security→"university", vpn→"gaming"
//   screen_size        ← software_type directly ("os"/"office"/"security"/"vpn")
//                        The +10 exact screen_size match bonus is the primary sub-type filter.
//                        os and vpn both map purpose="gaming" but screen_size discriminates them.
//   battery_importance ← use_case: enterprise/business→"very-important", home→"somewhat-important", student→"not-important"
//   portability        ← platform: cross-platform→"frequently-travel", mac→"occasionally-travel", windows→"desk-use"
//   brand_preference   → DEFAULTS.brand_preference

const SOFTWARE_PROFILE: CategoryScoringProfile = {
  requiredFields: ["software_type", "use_case", "platform", "budget"],
  interpret: (p) => {
    const purposeMap: Record<string, string> = {
      os:       "gaming",
      office:   "work",
      security: "university",
      vpn:      "gaming",
    };

    const budgetMap: Record<string, string> = {
      "under-20": "under-500",
      "20-50":    "500-1000",
      "50-100":   "1000-1500",
      "100+":     "1500+",
    };

    const useCaseToBattery: Record<string, string> = {
      enterprise: "very-important",
      business:   "very-important",
      home:       "somewhat-important",
      student:    "not-important",
    };

    const platformToPortability: Record<string, string> = {
      "cross-platform": "frequently-travel",
      mac:              "occasionally-travel",
      windows:          "desk-use",
    };

    const softwareType = p.software_type ?? "";

    return {
      purpose:            purposeMap[softwareType]                 ?? DEFAULTS.purpose,
      budget:             budgetMap[p.budget ?? ""]                ?? DEFAULTS.budget,
      battery_importance: useCaseToBattery[p.use_case ?? ""]      ?? DEFAULTS.battery_importance,
      portability:        platformToPortability[p.platform ?? ""] ?? DEFAULTS.portability,
      screen_size:        softwareType || DEFAULTS.screen_size,
      brand_preference:   DEFAULTS.brand_preference,
    };
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CATEGORY_SCORING_PROFILES: Record<CategoryKey, CategoryScoringProfile> = {
  laptops:             LAPTOP_PROFILE,
  phones:              PHONE_PROFILE,
  monitors:            MONITOR_PROFILE,
  tablets:             TABLET_PROFILE,
  pcs:                 PC_PROFILE,
  health:              HEALTH_PROFILE,
  "travel-insurance":  TRAVEL_INSURANCE_PROFILE,
  software:            SOFTWARE_PROFILE,
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
