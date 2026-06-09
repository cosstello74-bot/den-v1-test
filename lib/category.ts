import laptopsData from "@/data/categories/laptops.json";
import phonesData from "@/data/categories/phones.json";
import monitorsData from "@/data/categories/monitors.json";
import tabletsData from "@/data/categories/tablets.json";
import pcsData from "@/data/categories/pcs.json";
import healthData          from "@/data/categories/health.json";
import travelInsuranceData from "@/data/categories/travel-insurance.json";
import type { CategoryConfig, CategoryKey } from "@/types/product";

const CATEGORY_MAP: Record<CategoryKey, CategoryConfig> = {
  laptops:             laptopsData          as CategoryConfig,
  phones:              phonesData           as CategoryConfig,
  monitors:            monitorsData         as CategoryConfig,
  tablets:             tabletsData          as CategoryConfig,
  pcs:                 pcsData              as CategoryConfig,
  health:              healthData           as CategoryConfig,
  "travel-insurance":  travelInsuranceData  as CategoryConfig,
};

export const CATEGORY_META: Record<CategoryKey, { label: string; description: string }> = {
  laptops:            { label: "Laptops",            description: "Portable computers for work, gaming and creativity" },
  phones:             { label: "Smartphones",        description: "The right phone for your lifestyle and budget" },
  monitors:           { label: "Monitors",           description: "Displays for gaming, productivity and content creation" },
  tablets:            { label: "Tablets",            description: "Versatile touch devices between phone and laptop" },
  pcs:                { label: "Desktop PCs",        description: "High-performance desktop systems for home and office" },
  health:             { label: "Supplements",        description: "Vitamins, protein and health foods ranked for your goal" },
  "travel-insurance": { label: "Travel Insurance",   description: "Single trip, annual and backpacker cover — ranked for your journey" },
};

export function getCategoryConfig(category: string): CategoryConfig {
  return CATEGORY_MAP[category as CategoryKey] ?? CATEGORY_MAP.laptops;
}

export function isValidCategory(category: string): category is CategoryKey {
  return Object.keys(CATEGORY_MAP).includes(category);
}

export function getAllCategories(): CategoryKey[] {
  return Object.keys(CATEGORY_MAP) as CategoryKey[];
}
