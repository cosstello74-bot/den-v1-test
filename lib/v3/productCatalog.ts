/**
 * V3 — Central Product Catalog
 * Single source of truth for all products across all categories.
 * Products are validated against category rules on registration.
 */

import type { Product, CategoryKey } from "@/types/product";
import { validateProduct, CATEGORY_RULES } from "./categoryRules";

// ─── Catalog store ────────────────────────────────────────────────────────────

const catalog = new Map<string, Product>();

// ─── Registration ─────────────────────────────────────────────────────────────

export function registerProduct(product: Product): void {
  const result = validateProduct(
    product as unknown as Record<string, unknown>,
    product.category as CategoryKey
  );

  if (!result.valid) {
    throw new Error(
      `Product "${product.id}" failed validation: ${result.reasons.join("; ")}`
    );
  }

  catalog.set(product.id, product);
}

export function registerMany(products: Product[]): void {
  for (const p of products) {
    registerProduct(p);
  }
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export function getProduct(id: string): Product | undefined {
  return catalog.get(id);
}

export function getByCategory(category: CategoryKey): Product[] {
  return Array.from(catalog.values()).filter(
    (p) => p.category === category
  );
}

export function getAll(): Product[] {
  return Array.from(catalog.values());
}

export function getCatalogSize(): number {
  return catalog.size;
}

// ─── Capacity guard ───────────────────────────────────────────────────────────

export function isCategoryAtCapacity(category: CategoryKey): boolean {
  const rule  = CATEGORY_RULES[category];
  const count = getByCategory(category).length;
  return count >= rule.maxProducts;
}
