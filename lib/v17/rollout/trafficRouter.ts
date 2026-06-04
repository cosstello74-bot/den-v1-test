/**
 * V17 Rollout — Traffic Router
 *
 * Deterministically assigns each session to a ranking engine (V15 or V16)
 * based on the current rollout percentage. Same session always gets the
 * same engine — no flickering between requests.
 *
 * Bucketing is hash-based, not random, so results are:
 *   - Stable across page loads
 *   - Reproducible for debugging
 *   - Reversible: lowering rolloutPercent puts bucket back on V15
 */

import { getRolloutStage, getRolloutPercent } from "./rolloutController";

// ─── Bucketing ────────────────────────────────────────────────────────────────

/**
 * Map sessionId → deterministic bucket [0, 99].
 * Uses djb2 hash — same as V16 hashUtils but outputs a bucket number.
 */
function sessionToBucket(sessionId: string): number {
  let hash = 5381;
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) + hash) ^ sessionId.charCodeAt(i);
    hash |= 0; // coerce to 32-bit int
  }
  return Math.abs(hash) % 100;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type RankingVersion = "v15" | "v16";

/**
 * Decide which ranking engine to use for a given session.
 *
 * Stage 0 (shadow):  always V15 for users; V16 runs in background only
 * Stage 1 (partial): bucket < rolloutPercent → V16; else V15
 * Stage 2 (full):    always V16
 * disabled:          always V15
 */
export function resolveVersion(sessionId: string): RankingVersion {
  const stage = getRolloutStage();

  switch (stage) {
    case "disabled":
      return "v15";

    case "shadow":
      // Users always see V15 in shadow mode; V16 runs silently for comparison
      return "v15";

    case "partial": {
      const bucket  = sessionToBucket(sessionId);
      const percent = getRolloutPercent();
      return bucket < percent ? "v16" : "v15";
    }

    case "full":
      return "v16";
  }
}

/**
 * True if this session should run V16 in shadow mode (background only).
 * Shadow mode always runs regardless of which version the user sees.
 */
export function shouldRunShadow(sessionId: string): boolean {
  const stage = getRolloutStage();
  if (stage === "disabled") return false;
  // Shadow mode: run on all sessions
  // Partial/full: run on a sample for drift tracking (first 20% of sessions)
  if (stage === "shadow")  return true;
  return sessionToBucket(sessionId) < 20;
}
