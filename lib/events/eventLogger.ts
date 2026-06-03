/**
 * Phase 2 — Event tracking namespace.
 *
 * Re-exports the core event logger and adds Phase-2 convenience helpers:
 *   logPageView()   — tracks page_view for landing/GEO pages
 *   logQuizStart()  — quiz_started
 *   logQuizComplete() — quiz_completed
 *   logProductView() — product_viewed
 *   logAffiliateClick() — affiliate_clicked
 *
 * Storage: localStorage (client-side only — no backend in Phase 2).
 */

export {
  logEvent,
  getStoredEvents,
  clearStoredEvents,
  flushPendingEvents,
} from "@/lib/eventLogger";

import { logEvent } from "@/lib/eventLogger";

// ─── Phase 2 convenience helpers ─────────────────────────────────────────────

export function logPageView(category: string, slug?: string): void {
  logEvent("page_view", category, { metadata: { slug: slug ?? category } });
}

export function logQuizStart(category: string): void {
  logEvent("quiz_started", category);
}

export function logQuizComplete(
  category: string,
  purpose: string,
  budget:  string
): void {
  logEvent("quiz_completed", category, { purpose, budget });
}

export function logProductView(
  category:  string,
  productId: string,
  rank:      number,
  purpose?:  string
): void {
  logEvent("product_viewed", category, { productId, purpose, metadata: { rank } });
}

export function logAffiliateClick(
  category:  string,
  productId: string,
  rank:      number
): void {
  logEvent("affiliate_clicked", category, { productId, metadata: { rank } });
}
