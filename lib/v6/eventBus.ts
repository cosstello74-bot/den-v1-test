/**
 * V6 — Event Bus
 * Lightweight, serverless-safe pub/sub for tracking events.
 * Listeners are registered per process instance only (not cross-request).
 * For durable event processing wire listeners to a queue or DB handler.
 */

// ─── Event types ──────────────────────────────────────────────────────────────

export type V6EventType =
  | "page_view"
  | "product_view"
  | "affiliate_click"
  | "dwell"
  | "bounce"
  | "quiz_start"
  | "quiz_complete";

export type V6Event = {
  type:      V6EventType;
  slug:      string;
  productId?: string;
  sessionId:  string;
  value?:     number;   // e.g. dwell time in seconds, revenue amount
  meta?:      Record<string, unknown>;
  timestamp:  number;
};

// ─── Bus ──────────────────────────────────────────────────────────────────────

type Listener = (event: V6Event) => void | Promise<void>;

const listeners = new Map<V6EventType | "*", Set<Listener>>();

export function on(type: V6EventType | "*", listener: Listener): void {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(listener);
}

export function off(type: V6EventType | "*", listener: Listener): void {
  listeners.get(type)?.delete(listener);
}

export async function emit(event: V6Event): Promise<void> {
  const typed    = listeners.get(event.type);
  const wildcard = listeners.get("*");

  const calls: Promise<void>[] = [];

  typed?.forEach((l) => calls.push(Promise.resolve(l(event))));
  wildcard?.forEach((l) => calls.push(Promise.resolve(l(event))));

  await Promise.allSettled(calls);
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createEvent(
  type:      V6EventType,
  slug:      string,
  sessionId: string,
  extras?:   Partial<Pick<V6Event, "productId" | "value" | "meta">>
): V6Event {
  return {
    type,
    slug,
    sessionId,
    timestamp: Date.now(),
    ...extras,
  };
}
