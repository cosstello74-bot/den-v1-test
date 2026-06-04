/**
 * v2 Session memory — localStorage-only session state.
 *
 * Persists per-session user behaviour for adaptive ranking:
 *   - last quiz answers (enables "retake" prefill)
 *   - viewed products (with view counts)
 *   - clicked products
 *   - affiliate clicks (strongest signal)
 *
 * Sessions expire after 24 hours of inactivity.
 * Server-side safe: all localStorage access is guarded.
 */


// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionState {
  sessionId:       string;
  startedAt:       number;     // Unix ms
  lastActiveAt:    number;     // Unix ms
  quizAnswers?:    Record<string, string>;
  viewedProducts:  Record<string, number>;  // productId → view count
  clickedProducts: string[];
  affiliateClicks: string[];   // may repeat if user clicks same product multiple times
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KEY     = "den_session_v2";
const TTL_MS  = 24 * 60 * 60 * 1000; // 24 hours

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== "undefined";
}

function freshSession(): SessionState {
  return {
    sessionId:       typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now()),
    startedAt:       Date.now(),
    lastActiveAt:    Date.now(),
    viewedProducts:  {},
    clickedProducts: [],
    affiliateClicks: [],
  };
}

function read(): SessionState | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SessionState;
    if (Date.now() - s.lastActiveAt > TTL_MS) return null; // expired
    return s;
  } catch {
    return null;
  }
}

function write(s: SessionState): void {
  if (!isClient()) return;
  try {
    s.lastActiveAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* storage quota */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get current session (creates fresh one if none exists or expired). */
export function getSession(): SessionState {
  return read() ?? freshSession();
}

/** Persist quiz answers for prefill on retake. */
export function saveQuizAnswers(answers: Record<string, string>): void {
  const s = getSession();
  s.quizAnswers = answers;
  write(s);
}

/** Get last stored quiz answers. */
export function getSavedQuizAnswers(): Record<string, string> | undefined {
  return read()?.quizAnswers;
}

/** Record a product view impression. */
export function recordProductView(productId: string): void {
  const s = getSession();
  s.viewedProducts[productId] = (s.viewedProducts[productId] ?? 0) + 1;
  write(s);
}

/** Record a product card click (not affiliate). */
export function recordProductClick(productId: string): void {
  const s = getSession();
  if (!s.clickedProducts.includes(productId)) {
    s.clickedProducts.push(productId);
  }
  write(s);
}

/** Record an affiliate link click. */
export function recordAffiliateClick(productId: string): void {
  const s = getSession();
  s.affiliateClicks.push(productId);
  write(s);
}

/** True if this user has previous session data with any clicks. */
export function isReturningUser(): boolean {
  const s = read();
  return s !== null && s.affiliateClicks.length > 0;
}

/** True if the user has clicked this specific product before. */
export function hasPreviouslyClicked(productId: string): boolean {
  const s = read();
  return s !== null && (
    s.clickedProducts.includes(productId) ||
    s.affiliateClicks.includes(productId)
  );
}

/** Clear the session (e.g. on quiz retake with different answers). */
export function clearSession(): void {
  if (!isClient()) return;
  localStorage.removeItem(KEY);
}

/** Convert session signals into the format expected by computeAdjustmentMap. */
export function sessionToSignalEvents(s: SessionState): Array<{
  type: string; productId: string; timestamp: number;
}> {
  const events: Array<{ type: string; productId: string; timestamp: number }> = [];

  for (const [pid, count] of Object.entries(s.viewedProducts)) {
    for (let i = 0; i < count; i++) {
      events.push({ type: "product_viewed", productId: pid, timestamp: s.startedAt });
    }
  }

  for (const pid of s.clickedProducts) {
    events.push({ type: "product_clicked", productId: pid, timestamp: s.startedAt });
  }

  for (const pid of s.affiliateClicks) {
    events.push({ type: "affiliate_clicked", productId: pid, timestamp: s.startedAt });
  }

  return events;
}
