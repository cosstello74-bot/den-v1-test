/**
 * V6 — Frontend Tracker
 * Lightweight client-side tracking helper.
 * Sends events to /api/v6/track — fire-and-forget, never blocks UI.
 */

import type { V6EventType, V6Event } from "./eventBus";

// ─── Session ──────────────────────────────────────────────────────────────────

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";

  let id = sessionStorage.getItem("den_sid");
  if (!id) {
    id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem("den_sid", id);
  }
  return id;
}

// ─── Core send ────────────────────────────────────────────────────────────────

function send(payload: Omit<V6Event, "timestamp" | "sessionId">): void {
  const event: V6Event = {
    ...payload,
    sessionId: getSessionId(),
    timestamp: Date.now(),
  };

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/v6/track", JSON.stringify(event));
  } else {
    fetch("/api/v6/track", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(event),
      keepalive: true,
    }).catch(() => {});
  }
}

// ─── Public tracking API ──────────────────────────────────────────────────────

export function trackPageView(slug: string): void {
  send({ type: "page_view", slug });
}

export function trackProductView(slug: string, productId: string): void {
  send({ type: "product_view", slug, productId });
}

export function trackAffiliateClick(slug: string, productId: string): void {
  send({ type: "affiliate_click", slug, productId });
}

export function trackDwell(slug: string, seconds: number): void {
  send({ type: "dwell", slug, value: seconds });
}

export function trackBounce(slug: string): void {
  send({ type: "bounce", slug });
}

export function trackQuizStart(slug: string): void {
  send({ type: "quiz_start", slug });
}

export function trackQuizComplete(slug: string): void {
  send({ type: "quiz_complete", slug });
}
