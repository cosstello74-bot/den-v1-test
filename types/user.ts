/**
 * User types — session state, identity, and quiz progress.
 *
 * UserProfile (quiz answers that drive scoring) lives in types/product.ts.
 * This file covers runtime session state and client-side user identity.
 */

export type { UserProfile } from "@/types/product";

// ─── Session state ────────────────────────────────────────────────────────────

/** Runtime session tracking — stored in localStorage, not persisted server-side. */
export interface UserSession {
  sessionId:        string;
  startedAt:        number;   // Unix ms
  category?:        string;
  completedQuiz:    boolean;
  resultsViewed:    boolean;
  affiliateClicks:  number;
  lastActiveAt:     number;
}

/** Quiz progress state across steps. */
export interface QuizState {
  step:       number;
  totalSteps: number;
  answers:    Partial<import("@/types/product").UserProfile>;
  startedAt:  number;
}

/** Minimal user identity inferred from session signals (no auth). */
export interface InferredUser {
  sessionId:     string;
  segment?:      "student" | "gamer" | "professional" | "creator" | "general";
  trafficSource: string;
  isReturning:   boolean;
}
