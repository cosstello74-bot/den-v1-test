import type { CategoryKey } from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchVolume    = "high" | "medium" | "low";
export type ConversionPotential = "high" | "medium" | "low";

export type IntentSignal = {
  intent:              string;
  slug:                string;
  category:            CategoryKey;
  searchVolume:        SearchVolume;
  conversionPotential: ConversionPotential;
  hasPage:             boolean;
  priority:            number; // 0-100 — deterministic rank
  quizMapping: {        // what quiz answers align to this intent
    purpose?:    string;
    budget?:     string;
    segment?:    string;
  };
};

// ─── Intent vocabulary ────────────────────────────────────────────────────────

type IntentDefinition = Omit<IntentSignal, "hasPage" | "priority">;

const INTENT_DEFINITIONS: IntentDefinition[] = [
  // ── Laptops ──
  {
    intent: "gaming_budget",
    slug: "best-gaming-laptops-under-1000",
    category: "laptops",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { purpose: "gaming", budget: "500-1000", segment: "gamer" },
  },
  {
    intent: "student_value",
    slug: "best-laptops-for-students",
    category: "laptops",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { purpose: "university", budget: "under-500", segment: "student" },
  },
  {
    intent: "developer_professional",
    slug: "best-laptops-for-coding",
    category: "laptops",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { purpose: "work", segment: "professional" },
  },
  {
    intent: "travel_portable",
    slug: "lightweight-laptops-for-travel",
    category: "laptops",
    searchVolume: "medium",
    conversionPotential: "medium",
    quizMapping: { purpose: "work", segment: "professional" },
  },
  {
    intent: "creative_professional",
    slug: "best-laptops-for-video-editing",
    category: "laptops",
    searchVolume: "medium",
    conversionPotential: "high",
    quizMapping: { purpose: "creative", segment: "creator" },
  },
  {
    intent: "budget_general",
    slug: "best-budget-laptops-under-500",
    category: "laptops",
    searchVolume: "high",
    conversionPotential: "medium",
    quizMapping: { budget: "under-500", segment: "student" },
  },
  {
    intent: "premium_professional",
    slug: "best-premium-laptops-for-professionals",
    category: "laptops",
    searchVolume: "medium",
    conversionPotential: "high",
    quizMapping: { purpose: "work", budget: "1500+", segment: "professional" },
  },

  // ── Phones ──
  {
    intent: "camera_phone",
    slug: "best-phones-for-photography",
    category: "phones",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { purpose: "creative", segment: "creator" },
  },
  {
    intent: "battery_phone",
    slug: "best-battery-life-phones",
    category: "phones",
    searchVolume: "high",
    conversionPotential: "medium",
    quizMapping: { segment: "general" },
  },
  {
    intent: "budget_phone",
    slug: "best-budget-smartphones",
    category: "phones",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { budget: "under-500", segment: "student" },
  },
  {
    intent: "gaming_phone",
    slug: "best-gaming-phones",
    category: "phones",
    searchVolume: "medium",
    conversionPotential: "medium",
    quizMapping: { purpose: "gaming", segment: "gamer" },
  },

  // ── Monitors ──
  {
    intent: "gaming_monitor",
    slug: "best-gaming-monitors",
    category: "monitors",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { purpose: "gaming", segment: "gamer" },
  },
  {
    intent: "creative_monitor",
    slug: "best-monitors-for-video-editing",
    category: "monitors",
    searchVolume: "medium",
    conversionPotential: "high",
    quizMapping: { purpose: "creative", segment: "creator" },
  },
  {
    intent: "budget_monitor",
    slug: "best-budget-monitors",
    category: "monitors",
    searchVolume: "medium",
    conversionPotential: "medium",
    quizMapping: { budget: "under-500", segment: "general" },
  },

  // ── Tablets ──
  {
    intent: "student_tablet",
    slug: "best-tablets-for-students",
    category: "tablets",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { purpose: "university", segment: "student" },
  },
  {
    intent: "drawing_tablet",
    slug: "best-tablets-for-drawing",
    category: "tablets",
    searchVolume: "medium",
    conversionPotential: "high",
    quizMapping: { purpose: "creative", segment: "creator" },
  },

  // ── PCs ──
  {
    intent: "gaming_pc",
    slug: "best-gaming-pcs",
    category: "pcs",
    searchVolume: "high",
    conversionPotential: "high",
    quizMapping: { purpose: "gaming", segment: "gamer" },
  },
  {
    intent: "editing_pc",
    slug: "best-pcs-for-video-editing",
    category: "pcs",
    searchVolume: "medium",
    conversionPotential: "high",
    quizMapping: { purpose: "creative", segment: "creator" },
  },
];

// ─── Priority formula ─────────────────────────────────────────────────────────

const VOLUME_SCORE:     Record<SearchVolume, number>       = { high: 40, medium: 25, low: 10 };
const CONV_SCORE:       Record<ConversionPotential, number> = { high: 40, medium: 25, low: 10 };

function computePriority(intent: IntentDefinition, hasPage: boolean): number {
  if (hasPage) return 0;
  return VOLUME_SCORE[intent.searchVolume] + CONV_SCORE[intent.conversionPotential] + 20;
}

// ─── Main function ────────────────────────────────────────────────────────────

export function discoverIntents(
  existingPageSlugs: string[],
  filterCategory?:   CategoryKey
): IntentSignal[] {
  return INTENT_DEFINITIONS
    .filter((d) => !filterCategory || d.category === filterCategory)
    .map((d): IntentSignal => {
      const hasPage = existingPageSlugs.includes(d.slug);
      return { ...d, hasPage, priority: computePriority(d, hasPage) };
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Returns only unserved high-priority intents above a minimum priority score.
 */
export function getActionableIntents(
  existingPageSlugs: string[],
  minPriority:       number = 60
): IntentSignal[] {
  return discoverIntents(existingPageSlugs)
    .filter((i) => !i.hasPage && i.priority >= minPriority);
}
