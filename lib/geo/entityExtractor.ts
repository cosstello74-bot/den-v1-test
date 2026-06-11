import type { Product, CategoryKey } from "@/types/product";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EntityType =
  | "product"
  | "brand"
  | "category"
  | "use-case"
  | "performance-attribute";

export type Entity = {
  label: string;
  type:  EntityType;
  score?: number; // relevance 0-100
};

// ─── Static attribute vocabulary ──────────────────────────────────────────────

const PERFORMANCE_ATTRIBUTES: Record<CategoryKey, string[]> = {
  laptops:            ["battery life", "portability", "gaming performance", "productivity", "value for money", "display quality", "build quality"],
  phones:             ["camera quality", "battery capacity", "processing speed", "display quality", "5G connectivity", "value for money"],
  monitors:           ["refresh rate", "response time", "colour accuracy", "resolution", "panel type", "HDR support", "value for money"],
  tablets:            ["processing speed", "display quality", "battery endurance", "stylus support", "portability", "value for money"],
  pcs:                ["CPU performance", "GPU capability", "memory capacity", "storage speed", "upgradeability", "value for money"],
  health:             ["effectiveness", "ingredient quality", "scientific backing", "ease of use", "value for money", "taste", "bioavailability"],
  "travel-insurance": ["medical coverage", "cancellation cover", "baggage protection", "policy excess", "24/7 emergency assistance", "value for money", "claim ease"],
  software:           ["performance", "compatibility", "multi-device support", "ease of activation", "security features", "value for money", "update frequency"],
  home:               ["performance", "energy efficiency", "capacity", "compact design", "ease of use", "noise level", "value for money"],
};

const USE_CASE_ENTITIES: Record<CategoryKey, string[]> = {
  laptops:            ["gaming laptops", "work laptops", "student laptops", "creative laptops", "thin and light laptops", "budget laptops"],
  phones:             ["camera phones", "gaming phones", "battery life phones", "flagship phones", "budget phones"],
  monitors:           ["gaming monitors", "4K monitors", "ultrawide monitors", "creative monitors", "office monitors"],
  tablets:            ["iPad alternatives", "Android tablets", "drawing tablets", "education tablets", "productivity tablets"],
  pcs:                ["gaming desktops", "workstation PCs", "mini PCs", "all-in-one PCs", "budget PCs"],
  health:             ["protein supplements", "vegan vitamins", "organic health foods", "weight management supplements", "sports nutrition", "daily vitamins"],
  "travel-insurance": ["single trip insurance", "annual multi-trip insurance", "Europe travel insurance", "worldwide travel insurance", "backpacker insurance", "adventure sports cover"],
  software:           ["Windows licence", "Office suite", "antivirus protection", "VPN service", "small business security", "productivity software"],
  home:               ["air purifiers", "dehumidifiers", "fan heaters", "air fryers", "cordless vacuums", "home cleaning appliances"],
};

const CATEGORY_ENTITIES: Record<CategoryKey, string[]> = {
  laptops:            ["laptop", "portable computer", "notebook", "ultrabook"],
  phones:             ["smartphone", "mobile phone", "Android phone", "iPhone"],
  monitors:           ["monitor", "display", "screen", "PC display"],
  tablets:            ["tablet", "iPad", "Android tablet", "2-in-1"],
  pcs:                ["desktop PC", "desktop computer", "tower PC", "workstation"],
  health:             ["supplement", "vitamins", "protein powder", "health food", "nutrition"],
  "travel-insurance": ["travel insurance", "holiday insurance", "trip insurance", "medical cover abroad"],
  software:           ["software licence", "digital licence", "product key", "download key", "software activation"],
  home:               ["home appliance", "air treatment", "kitchen appliance", "cleaning appliance", "small domestic appliance"],
};

// ─── Main function ────────────────────────────────────────────────────────────

export function extractEntities(
  products: Product[],
  category: CategoryKey
): Entity[] {
  const entities: Entity[] = [];

  // Product entities
  for (const p of products) {
    entities.push({ label: p.name, type: "product", score: 100 });
  }

  // Brand entities (deduplicated)
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  for (const brand of brands) {
    entities.push({ label: brand, type: "brand", score: 90 });
  }

  // Category entities
  for (const cat of CATEGORY_ENTITIES[category] ?? []) {
    entities.push({ label: cat, type: "category", score: 85 });
  }

  // Use-case entities
  for (const uc of USE_CASE_ENTITIES[category] ?? []) {
    entities.push({ label: uc, type: "use-case", score: 80 });
  }

  // Performance attribute entities
  for (const attr of PERFORMANCE_ATTRIBUTES[category] ?? []) {
    entities.push({ label: attr, type: "performance-attribute", score: 75 });
  }

  return entities;
}

/**
 * Returns a flat string array suitable for `keywords` metadata injection.
 */
export function extractEntityLabels(
  products: Product[],
  category: CategoryKey
): string[] {
  return extractEntities(products, category).map((e) => e.label);
}

/**
 * Entity density: ratio of distinct entities to a notional content size.
 * Used as input to geoScore.
 */
export function computeEntityDensity(entities: Entity[]): number {
  const uniqueLabels = new Set(entities.map((e) => e.label.toLowerCase())).size;
  // Normalise against a target of 40 entities for a fully-dense page
  return Math.min(Math.round((uniqueLabels / 40) * 100), 100);
}
