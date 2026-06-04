/**
 * V16 Observability — Event Collector
 *
 * In-memory queue for ranking-related signal events.
 * Events are accumulated within a session and consumed by
 * driftDetector, biasDetector, and metricsAggregator.
 *
 * Server-safe: no localStorage, no DOM access.
 * All state is module-level and resets on process restart.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RankingEventType =
  | "ranking_produced"      // a ranked list was shown to a user
  | "revenue_tiebreak_fired" // epsilon tiebreaker activated
  | "guardrail_violation"   // a guardrail check failed
  | "shadow_divergence"     // shadow ranking diff detected
  | "product_viewed"
  | "product_clicked"
  | "affiliate_clicked";

export interface RankingEvent {
  type:        RankingEventType;
  timestamp:   number;           // Unix ms
  category:    string;
  sessionId?:  string;
  productId?:  string;
  rank?:       number;
  metadata?:   Record<string, unknown>;
}

// ─── In-memory queue ──────────────────────────────────────────────────────────

const MAX_QUEUE_SIZE = 500;
const _queue: RankingEvent[] = [];

// ─── Public API ───────────────────────────────────────────────────────────────

export function emitEvent(event: RankingEvent): void {
  _queue.push(event);
  if (_queue.length > MAX_QUEUE_SIZE) {
    _queue.shift(); // drop oldest when at capacity
  }
}

export function getEvents(type?: RankingEventType): RankingEvent[] {
  if (!type) return [..._queue];
  return _queue.filter((e) => e.type === type);
}

export function clearEvents(): void {
  _queue.length = 0;
}

export function getQueueSize(): number {
  return _queue.length;
}
