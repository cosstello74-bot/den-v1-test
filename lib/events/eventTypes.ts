/**
 * Phase 2 — Event type constants and type guards.
 *
 * Centralises all event type strings to avoid string-literal duplication
 * across the event logger, aggregator, and learning loop.
 */

import type { EventType } from "@/types/event";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ET = {
  PAGE_VIEW:             "page_view",
  QUIZ_STARTED:          "quiz_started",
  QUIZ_COMPLETED:        "quiz_completed",
  RESULTS_VIEWED:        "results_viewed",
  PRODUCT_VIEWED:        "product_viewed",
  PRODUCT_CLICKED:       "product_clicked",
  AFFILIATE_CLICKED:     "affiliate_clicked",
  PRODUCT_RETURNED:      "product_returned",
  PRODUCT_REVISITED:     "product_revisited",
  CONVERSION_CONFIRMED:  "conversion_confirmed",
  CONVERSION_FAILED:     "conversion_failed",
} as const satisfies Record<string, EventType>;

export type EventTypeConst = (typeof ET)[keyof typeof ET];

// ─── Funnel stage ordering ─────────────────────────────────────────────────────

/** Ordered funnel stages from awareness to conversion. */
export const FUNNEL_STAGES: EventType[] = [
  "page_view",
  "quiz_started",
  "quiz_completed",
  "results_viewed",
  "product_viewed",
  "affiliate_clicked",
];

export const FUNNEL_LABELS: Record<string, string> = {
  page_view:          "Page View",
  quiz_started:       "Quiz Started",
  quiz_completed:     "Quiz Completed",
  results_viewed:     "Results Viewed",
  product_viewed:     "Product Viewed",
  affiliate_clicked:  "Affiliate Clicked",
};

// ─── Outcome events ───────────────────────────────────────────────────────────

export const OUTCOME_EVENT_TYPES: EventType[] = [
  "product_returned",
  "product_revisited",
  "conversion_confirmed",
  "conversion_failed",
];

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isFunnelEvent(type: string): type is EventType {
  return (FUNNEL_STAGES as string[]).includes(type);
}

export function isOutcomeEvent(type: string): type is EventType {
  return (OUTCOME_EVENT_TYPES as string[]).includes(type);
}

export function isPositiveOutcome(type: string): boolean {
  return type === "conversion_confirmed" || type === "product_revisited";
}

export function isNegativeOutcome(type: string): boolean {
  return type === "conversion_failed" || type === "product_returned";
}
