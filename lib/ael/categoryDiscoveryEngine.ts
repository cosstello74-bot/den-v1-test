/**
 * v4 Category Discovery Engine.
 *
 * Detects missing or emerging categories from:
 *   - Intent frequency clusters (MinedIntent[] from intentMiningEngine)
 *   - Repeated quiz-answer purpose+budget patterns
 *   - High-frequency intent groups not covered by existing categories
 *
 * In seed mode (no events), surfaces vocabulary-level clusters.
 */

import type { MinedIntent }  from "./intentMiningEngine";
import type { CategoryKey }  from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiscoveredCategory = {
  id:             string;
  name:           string;
  description:    string;
  category:       CategoryKey;
  confidence:     number;   // 0-1
  intentKeys:     string[]; // contributing intent keys
  totalFrequency: number;   // sum of contributing intent frequencies
  source:         "intent_cluster" | "vocabulary";
};

// ─── Cluster specifications ───────────────────────────────────────────────────

type ClusterSpec = {
  id:             string;
  name:           string;
  description:    string;
  category:       CategoryKey;
  matchKeys:      string[];  // intent keys that map to this cluster
  minFrequency:   number;    // min total frequency to activate (0 = vocabulary-only OK)
  baseConfidence: number;
};

const CLUSTER_SPECS: ClusterSpec[] = [
  {
    id:             "travel-portables",
    name:           "Travel Laptops",
    description:    "Laptops optimised for portability and all-day battery life. Ranked for frequent-traveller and mobile-professional use cases.",
    category:       "laptops",
    matchKeys:      ["professional_mid", "professional_any", "professional_budget"],
    minFrequency:   0,
    baseConfidence: 0.87,
  },
  {
    id:             "budget-creative",
    name:           "Budget Creative Laptops",
    description:    "Mid-range laptops suitable for creative work at accessible price points. Scored on productivity and display quality.",
    category:       "laptops",
    matchKeys:      ["creative_mid", "creative_budget"],
    minFrequency:   0,
    baseConfidence: 0.86,
  },
  {
    id:             "premium-professional",
    name:           "Premium Professional Laptops",
    description:    "High-end laptops for professional use. Scored on sustained CPU performance, build quality, and enterprise-grade reliability.",
    category:       "laptops",
    matchKeys:      ["professional_high", "professional_premium"],
    minFrequency:   0,
    baseConfidence: 0.89,
  },
  {
    id:             "student-budget",
    name:           "Student Budget Laptops",
    description:    "Entry-level laptops for university use. Ranked primarily on value score, battery endurance, and portability.",
    category:       "laptops",
    matchKeys:      ["student_budget", "student_any"],
    minFrequency:   0,
    baseConfidence: 0.88,
  },
  {
    id:             "gaming-premium",
    name:           "Premium Gaming Laptops",
    description:    "High-performance gaming laptops at premium price points. Scored on GPU capability, thermal management, and display quality.",
    category:       "laptops",
    matchKeys:      ["gaming_high", "gaming_premium"],
    minFrequency:   0,
    baseConfidence: 0.90,
  },
  {
    id:             "gaming-budget",
    name:           "Budget Gaming Laptops",
    description:    "Entry-level gaming laptops delivering competitive performance at budget and mid price points.",
    category:       "laptops",
    matchKeys:      ["gaming_budget", "gaming_mid"],
    minFrequency:   0,
    baseConfidence: 0.91,
  },
];

// ─── Main function ────────────────────────────────────────────────────────────

export function discoverCategories(
  intents:             MinedIntent[],
  existingCategoryIds: string[]
): DiscoveredCategory[] {
  const results: DiscoveredCategory[] = [];

  for (const spec of CLUSTER_SPECS) {
    if (existingCategoryIds.includes(spec.id)) continue;

    const matching = intents.filter((i) =>
      spec.matchKeys.includes(i.key) && i.category === spec.category
    );

    if (matching.length === 0) continue;

    const totalFrequency = matching.reduce((s, i) => s + i.frequency, 0);
    const isSeedMode     = matching.every((i) => i.frequency === 0);

    // Require minFrequency only when we have real events
    if (!isSeedMode && totalFrequency < spec.minFrequency) continue;

    // Boost confidence for high-frequency clusters
    const freqBoost  = totalFrequency > 0 ? Math.min(totalFrequency / 30, 0.05) : 0;
    const confidence = Math.min(
      Math.round((spec.baseConfidence + freqBoost) * 100) / 100,
      0.98
    );

    results.push({
      id:             spec.id,
      name:           spec.name,
      description:    spec.description,
      category:       spec.category,
      confidence,
      intentKeys:     matching.map((i) => i.key),
      totalFrequency,
      source:         isSeedMode ? "vocabulary" : "intent_cluster",
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
