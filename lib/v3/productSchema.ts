/**
 * V3 — Product Schema System
 * Defines category-specific product specs as strict TypeScript types.
 * Base Product type lives in @/types/product; v3 extends it with
 * category-specific attributes that cannot bleed across categories.
 */

import type { Product, CategoryKey } from "@/types/product";

// ─── Category-specific spec types ────────────────────────────────────────────

export type LaptopSpec = {
  category: "laptops";
  ram_gb: number;
  storage_gb: number;
  cpu_tier: "entry" | "mid" | "high" | "flagship";
  gpu_tier: "integrated" | "entry" | "mid" | "high";
  display_hz: number;
  weight_kg: number;
};

export type PhoneSpec = {
  category: "phones";
  ram_gb: number;
  storage_gb: number;
  camera_mp: number;
  battery_mah: number;
  display_hz: number;
  os: "android" | "ios";
};

export type MonitorSpec = {
  category: "monitors";
  resolution: "1080p" | "1440p" | "4K";
  panel_type: "IPS" | "VA" | "TN" | "OLED";
  refresh_hz: number;
  response_ms: number;
  size_inches: number;
};

export type TabletSpec = {
  category: "tablets";
  ram_gb: number;
  storage_gb: number;
  display_inches: number;
  stylus_support: boolean;
  os: "android" | "ipados" | "windows";
};

export type PCSpec = {
  category: "pcs";
  ram_gb: number;
  storage_gb: number;
  cpu_tier: "entry" | "mid" | "high" | "flagship";
  gpu_tier: "integrated" | "entry" | "mid" | "high";
  form_factor: "tower" | "mini" | "all-in-one";
};

// ─── Discriminated union of all specs ────────────────────────────────────────

export type ProductSpec =
  | LaptopSpec
  | PhoneSpec
  | MonitorSpec
  | TabletSpec
  | PCSpec;

// ─── Extended product with spec ───────────────────────────────────────────────

export type ProductWithSpec<S extends ProductSpec = ProductSpec> = Product & {
  spec: S;
};

// ─── Category → spec type mapping ────────────────────────────────────────────

export type SpecForCategory<C extends CategoryKey> =
  C extends "laptops"  ? LaptopSpec  :
  C extends "phones"   ? PhoneSpec   :
  C extends "monitors" ? MonitorSpec :
  C extends "tablets"  ? TabletSpec  :
  C extends "pcs"      ? PCSpec      :
  never;

// ─── Validation helper ────────────────────────────────────────────────────────

export function specMatchesCategory(
  spec: ProductSpec,
  category: CategoryKey
): boolean {
  return spec.category === category;
}
