/**
 * v5 Test Orchestrator.
 *
 * Deterministic user→variant assignment.
 * Uses a simple djb2-style hash of the session ID modulo 4 to
 * produce a stable, reproducible variant for the session lifetime.
 *
 * Assignment map:
 *   hash % 4 === 0 → A (relevance_first)
 *   hash % 4 === 1 → B (revenue_first)
 *   hash % 4 === 2 → C (hybrid_balanced)
 *   hash % 4 === 3 → D (engagement_weighted)
 *
 * Session ID is generated once and stored in localStorage.
 * localStorage key: den_v5_variant
 *
 * SSR-safe: server always returns null — variant resolved client-side.
 */

import type { VariantId } from "./variantEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VariantAssignment = {
  sessionId: string;
  variantId: VariantId;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "den_v5_variant";

const BUCKET_TO_VARIANT: Record<number, VariantId> = {
  0: "A",
  1: "B",
  2: "C",
  3: "D",
};

// ─── Hash function ────────────────────────────────────────────────────────────

/**
 * djb2 hash — deterministic, integer output, no external dependencies.
 * Always returns a non-negative 32-bit integer.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;  // keep unsigned 32-bit
  }
  return hash;
}

// ─── Session ID ───────────────────────────────────────────────────────────────

/**
 * Generate a random session ID string.
 * Format: 16 hex characters.
 */
export function generateSessionId(): string {
  const arr = new Uint8Array(8);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(arr);
  } else {
    // SSR fallback — not used for real assignment
    for (let i = 0; i < 8; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Assignment ───────────────────────────────────────────────────────────────

/**
 * Assign a variant from a session ID.
 * Pure function — no side effects.
 */
export function assignVariant(sessionId: string): VariantId {
  const bucket = hashString(sessionId) % 4;
  return BUCKET_TO_VARIANT[bucket];
}

/**
 * Resolve the current session's variant assignment.
 *
 * - If an assignment already exists in localStorage, returns it (stable).
 * - Otherwise generates a new session ID, assigns a variant, persists, and returns it.
 *
 * Returns null on the server (SSR).
 */
export function resolveVariantAssignment(): VariantAssignment | null {
  if (typeof window === "undefined") return null;

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      const parsed = JSON.parse(existing) as VariantAssignment;
      if (parsed.sessionId && parsed.variantId) return parsed;
    }
  } catch {
    // corrupt entry — regenerate
  }

  const sessionId = generateSessionId();
  const variantId = assignVariant(sessionId);
  const assignment: VariantAssignment = { sessionId, variantId };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignment));
  } catch {
    // quota exceeded — return assignment without persisting
  }

  return assignment;
}

/**
 * Clear the stored variant assignment.
 * Forces re-assignment on next resolveVariantAssignment() call.
 */
export function clearVariantAssignment(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get the currently assigned variant ID without creating a new assignment.
 * Returns null if no assignment exists or on the server.
 */
export function getCurrentVariant(): VariantId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VariantAssignment;
    return parsed.variantId ?? null;
  } catch {
    return null;
  }
}
