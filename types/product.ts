export type Purpose = "gaming" | "work" | "university" | "creative";
export type Budget = "under-500" | "500-1000" | "1000-1500" | "1500+";
export type BatteryImportance = "not-important" | "somewhat-important" | "very-important";
export type Portability = "desk-use" | "occasionally-travel" | "frequently-travel";
export type ScreenPreference = "13-14" | "15-16" | "17+" | "no-preference";
export type BrandPreference = "no-preference" | "Lenovo" | "ASUS" | "HP" | "Dell" | "Apple";
export type PriceBand = "budget" | "mid" | "high" | "premium";
export type CategoryKey = "laptops" | "phones" | "monitors" | "tablets" | "pcs" | "health" | "travel-insurance" | "software";

export interface RevenueProfile {
  affiliatePayout:        number;
  conversionRateEstimate: number;
  revenueTrend:           "rising" | "stable" | "declining";
}

export type AffiliateRetailer =
  | "amazon"
  | "currys"
  | "john_lewis"
  | "laptops_direct"
  | "very"
  | "dell_direct"
  | "hp_direct"
  | "lenovo_direct";

export interface AffiliateLink {
  retailer:       string;  // AffiliateRetailer values — string for JSON compat
  network:        string;  // AffiliateNetwork values — string for JSON compat
  url:            string;  // "PENDING" until real URL is added
  commission_pct: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  affiliate_url: string;        // primary URL — kept for backward compat
  affiliate_urls?: AffiliateLink[]; // multi-retailer registry
  price_band: PriceBand;
  battery_score: number;
  portability_score: number;
  gaming_score: number;
  productivity_score: number;
  value_score: number;
  screen_size: string;
  brand: string;
  revenueProfile?: RevenueProfile;
}

// Runtime-extended product with learning data applied
export interface ProductWithMetrics extends Product {
  dynamic_multiplier: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface ScoringProfile {
  battery_bonus?: number;
  portability_bonus?: number;
  gaming_bonus?: number;
  productivity_bonus?: number;
  value_bonus?: number;
  brand_bonus?: number;
}

export interface CategoryConfig {
  category: string;
  products: Product[];
  scoring_profile: ScoringProfile;
}

export interface UserProfile {
  purpose: Purpose;
  budget: Budget;
  battery_importance: BatteryImportance;
  portability: Portability;
  screen_size: ScreenPreference;
  brand_preference: BrandPreference;
}

export interface Recommendation {
  rank: number;
  score: number;
  product: ProductWithMetrics;
  strengths: string[];
}

// Global intelligence model
export interface GlobalProductStat {
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface CategoryStat {
  totalImpressions: number;
  ctr: number;
}

export interface GlobalModel {
  productStats: Record<string, GlobalProductStat>;
  categoryStats: Record<string, CategoryStat>;
  lastUpdated: string;
}

// Event tracking
export type TrackingEventType =
  | "quiz_started"
  | "question_answered"
  | "quiz_completed"
  | "results_viewed"
  | "product_viewed"
  | "affiliate_clicked";

export interface TrackingEvent {
  sessionId: string;
  timestamp: string;
  event: TrackingEventType;
  productId?: string;
  metadata: Record<string, unknown>;
}

export interface BatchEventPayload {
  events: TrackingEvent[];
}
