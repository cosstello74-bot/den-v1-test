import type { Product, CategoryKey } from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClusterSource =
  | "cluster_gaming"
  | "cluster_battery"
  | "cluster_value"
  | "cluster_portable"
  | "cluster_premium"
  | "cluster_productivity";

export type ProductFilterCriteria = {
  minGamingScore?:       number;
  minBatteryScore?:      number;
  minValueScore?:        number;
  minPortabilityScore?:  number;
  minProductivityScore?: number;
  priceBands?:           string[];
};

export type GeneratedCategory = {
  id:             string;
  name:           string;
  description:    string;
  baseCategory:   CategoryKey;
  productIds:     string[];
  filterCriteria: ProductFilterCriteria;
  confidence:     number;
  createdAt:      string;
  source:         ClusterSource;
};

// ─── Cluster rule definitions ─────────────────────────────────────────────────

type ClusterRule = {
  id:             string;
  name:           string;
  description:    string;
  source:         ClusterSource;
  baseCategory:   CategoryKey;
  filter:         ProductFilterCriteria;
  minProducts:    number; // minimum qualifying products to form a category
  confidence:     number;
};

const CLUSTER_RULES: ClusterRule[] = [
  {
    id:           "ultrabooks",
    name:         "Ultrabooks",
    description:  "Ultra-portable laptops with premium battery life and compact form factors. Ideal for travel and on-the-go professionals.",
    source:       "cluster_portable",
    baseCategory: "laptops",
    filter:       { minPortabilityScore: 80, minBatteryScore: 80 },
    minProducts:  3,
    confidence:   0.91,
  },
  {
    id:           "budget-workhorses",
    name:         "Budget Workhorses",
    description:  "High-value laptops delivering strong productivity for budget-conscious buyers.",
    source:       "cluster_value",
    baseCategory: "laptops",
    filter:       { minValueScore: 82, minProductivityScore: 75, priceBands: ["budget", "mid"] },
    minProducts:  3,
    confidence:   0.88,
  },
  {
    id:           "performance-gaming",
    name:         "Performance Gaming Laptops",
    description:  "Top-tier gaming laptops with gaming scores above 88. Suited to serious and competitive gamers.",
    source:       "cluster_gaming",
    baseCategory: "laptops",
    filter:       { minGamingScore: 88 },
    minProducts:  2,
    confidence:   0.93,
  },
  {
    id:           "professional-workhorses",
    name:         "Professional Workhorses",
    description:  "Laptops with high productivity scores optimised for professional and enterprise workloads.",
    source:       "cluster_productivity",
    baseCategory: "laptops",
    filter:       { minProductivityScore: 88 },
    minProducts:  3,
    confidence:   0.89,
  },
  {
    id:           "premium-creative",
    name:         "Premium Creative Laptops",
    description:  "Premium laptops with top productivity scores and battery life for creative professionals.",
    source:       "cluster_premium",
    baseCategory: "laptops",
    filter:       { minProductivityScore: 90, minBatteryScore: 85, priceBands: ["high", "premium"] },
    minProducts:  2,
    confidence:   0.87,
  },
];

// ─── Product filter ───────────────────────────────────────────────────────────

function matchesFilter(product: Product, filter: ProductFilterCriteria): boolean {
  if (filter.minGamingScore       !== undefined && product.gaming_score       < filter.minGamingScore)       return false;
  if (filter.minBatteryScore      !== undefined && product.battery_score      < filter.minBatteryScore)      return false;
  if (filter.minValueScore        !== undefined && product.value_score        < filter.minValueScore)        return false;
  if (filter.minPortabilityScore  !== undefined && product.portability_score  < filter.minPortabilityScore)  return false;
  if (filter.minProductivityScore !== undefined && product.productivity_score < filter.minProductivityScore) return false;
  if (filter.priceBands           !== undefined && !filter.priceBands.includes(product.price_band))         return false;
  return true;
}

// ─── Main function ────────────────────────────────────────────────────────────

export function generateCategories(
  products:         Product[],
  baseCategory:     CategoryKey,
  existingCategoryIds: string[]
): GeneratedCategory[] {
  const results: GeneratedCategory[] = [];
  const now = new Date().toISOString();

  const relevantRules = CLUSTER_RULES.filter((r) => r.baseCategory === baseCategory);

  for (const rule of relevantRules) {
    if (existingCategoryIds.includes(rule.id)) continue;

    const qualifying = products.filter((p) => matchesFilter(p, rule.filter));
    if (qualifying.length < rule.minProducts) continue;

    results.push({
      id:             rule.id,
      name:           rule.name,
      description:    rule.description,
      baseCategory,
      productIds:     qualifying.map((p) => p.id),
      filterCriteria: rule.filter,
      confidence:     rule.confidence,
      createdAt:      now,
      source:         rule.source,
    });
  }

  return results;
}

/**
 * Filter products from a base category set using stored criteria.
 * Used at render time to select products for a generated category page.
 */
export function filterProductsByCategory(
  products:  Product[],
  category:  GeneratedCategory
): Product[] {
  return products.filter((p) => matchesFilter(p, category.filterCriteria));
}
