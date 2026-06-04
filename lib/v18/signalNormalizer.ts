/**
 * V18 Learning — Signal Normaliser
 *
 * CRITICAL SAFETY STEP: sanitises all input signals before any learning
 * computation. Prevents bot spikes, malformed feedback, and extreme values
 * from corrupting the learning model.
 *
 * Rules applied:
 *   - dwellTime capped to [0, 600] seconds
 *   - clicked / dismissed coerced to boolean
 *   - rank clamped to [1, 100]
 *   - category validated against allowed set
 *   - timestamps validated (reject future / too-old events)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RawSignal {
  category?:   unknown;
  productId?:  unknown;
  clicked?:    unknown;
  dismissed?:  unknown;
  dwellTime?:  unknown;
  rank?:       unknown;
  timestamp?:  unknown;
}

export interface NormalisedSignal {
  category:   string;
  productId:  string;
  clicked:    boolean;
  dismissed:  boolean;
  dwellTime:  number;   // seconds, [0, 600]
  rank:       number;   // [1, 100]
  timestamp:  number;   // Unix ms, validated
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_CATEGORIES = new Set(["laptops", "phones", "monitors", "tablets", "pcs"]);
const MAX_DWELL_SECONDS  = 600;   // 10 minutes; beyond = bot / left tab open
const MAX_RANK           = 100;
const MAX_SIGNAL_AGE_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Normalise a single raw signal. Returns null if the signal is invalid
 * and should be discarded entirely.
 */
export function normaliseSignal(raw: RawSignal): NormalisedSignal | null {
  // Category must be a known value
  if (typeof raw.category !== "string" || !ALLOWED_CATEGORIES.has(raw.category)) {
    return null;
  }

  // productId must be a non-empty string
  if (typeof raw.productId !== "string" || raw.productId.trim() === "") {
    return null;
  }

  // Timestamp validation
  const now = Date.now();
  const ts  = typeof raw.timestamp === "number" ? raw.timestamp : now;
  if (ts > now + 60_000 || ts < now - MAX_SIGNAL_AGE_MS) {
    return null; // future timestamp or too old
  }

  return {
    category:  raw.category,
    productId: raw.productId.trim(),
    clicked:   Boolean(raw.clicked),
    dismissed: Boolean(raw.dismissed),
    dwellTime: Math.max(0, Math.min(typeof raw.dwellTime  === "number" ? raw.dwellTime  : 0, MAX_DWELL_SECONDS)),
    rank:      Math.max(1, Math.min(typeof raw.rank       === "number" ? Math.round(raw.rank) : 1, MAX_RANK)),
    timestamp: ts,
  };
}

/**
 * Normalise an array of raw signals. Discards invalid entries.
 * Returns only clean, validated signals safe for learning.
 */
export function normaliseSignals(raws: RawSignal[]): NormalisedSignal[] {
  const results: NormalisedSignal[] = [];
  for (const raw of raws) {
    const norm = normaliseSignal(raw);
    if (norm !== null) results.push(norm);
  }
  return results;
}

/** Rejection rate for monitoring — high rate may indicate bot traffic. */
export function computeRejectionRate(
  total:    number,
  accepted: number,
): number {
  if (total === 0) return 0;
  return (total - accepted) / total;
}
