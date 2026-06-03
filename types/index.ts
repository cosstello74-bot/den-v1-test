/**
 * Phase 0 — Type barrel.
 * Single import point for all DEN types.
 */

export type {
  Purpose,
  Budget,
  BatteryImportance,
  Portability,
  ScreenPreference,
  BrandPreference,
  PriceBand,
  CategoryKey,
  RevenueProfile,
  Product,
  ProductWithMetrics,
  ScoringProfile,
  CategoryConfig,
  UserProfile,
  Recommendation,
  GlobalProductStat,
  CategoryStat,
  GlobalModel,
  TrackingEventType,
  TrackingEvent,
  BatchEventPayload,
} from "./product";

export type {
  EventType,
  SegmentType,
  Event,
  BatchPayload,
} from "./event";
