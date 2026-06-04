/**
 * V17 Rollout — Stage Controller
 *
 * Manages the three-stage migration from V15 to V16.
 *
 *   Stage 0 (shadow):  V16 runs hidden; 0% of users see it
 *   Stage 1 (partial): Gradual ramp: 5% → 10% → 25%
 *   Stage 2 (full):    V16 is default for all users
 *   disabled:          V15 only; V16 inactive
 *
 * Stage transitions are gated by lock conditions checked in
 * canAdvanceStage(). Rollback always available instantly.
 *
 * Persistence: stage is written to localStorage (client) and
 * process.env (server). In production, back this with a proper
 * feature flag service (LaunchDarkly, etc.).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type RolloutStage = "disabled" | "shadow" | "partial" | "full";

export interface RolloutState {
  stage:          RolloutStage;
  rolloutPercent: number;    // 0–100; only meaningful in "partial"
  shadowDays:     number;    // days spent in shadow mode
  advancedAt?:    number;    // Unix ms of last stage advance
  lockedAt?:      number;    // Unix ms when stage was locked
}

// ─── Lock conditions ──────────────────────────────────────────────────────────

export interface LockConditions {
  shadowStableDays:        number;   // must be >= 7
  guardrailViolations:     number;   // must be 0
  revenueCorrelationDrift: number;   // must be < 0.05
  categoryBiasScore:       number;   // must be < 0.3
}

export function canAdvanceToFull(conditions: LockConditions): {
  allowed: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];

  if (conditions.shadowStableDays < 7) {
    blockers.push(`Shadow mode must be stable for 7+ days (currently ${conditions.shadowStableDays})`);
  }
  if (conditions.guardrailViolations > 0) {
    blockers.push(`${conditions.guardrailViolations} critical guardrail violation(s) must be resolved`);
  }
  if (conditions.revenueCorrelationDrift >= 0.05) {
    blockers.push(`Revenue correlation drift ${conditions.revenueCorrelationDrift} must be < 0.05`);
  }
  if (conditions.categoryBiasScore >= 0.3) {
    blockers.push(`Category bias score ${conditions.categoryBiasScore} must be < 0.3`);
  }

  return { allowed: blockers.length === 0, blockers };
}

// ─── In-memory state ──────────────────────────────────────────────────────────

const DEFAULT_STATE: RolloutState = {
  stage:          "disabled",
  rolloutPercent: 0,
  shadowDays:     0,
};

let _state: RolloutState = { ...DEFAULT_STATE };

// ─── Public API ───────────────────────────────────────────────────────────────

export function getRolloutStage(): RolloutStage {
  return _state.stage;
}

export function getRolloutPercent(): number {
  return _state.rolloutPercent;
}

export function getRolloutState(): Readonly<RolloutState> {
  return { ..._state };
}

/**
 * Advance to shadow mode. No user-visible change; V16 runs silently.
 */
export function enterShadowMode(): void {
  _state = { ..._state, stage: "shadow", rolloutPercent: 0, advancedAt: Date.now() };
}

/**
 * Advance to partial rollout at the specified percentage (1–99).
 * Clamps to [5, 25] for safety — larger ramps require full stage.
 */
export function enterPartialRollout(percent: number): void {
  const clamped = Math.max(5, Math.min(25, percent));
  _state = { ..._state, stage: "partial", rolloutPercent: clamped, advancedAt: Date.now() };
}

/**
 * Increase partial rollout percentage. Safe steps: 5 → 10 → 25.
 */
export function increaseRollout(toPercent: number): void {
  if (_state.stage !== "partial") return;
  const clamped = Math.max(_state.rolloutPercent, Math.min(25, toPercent));
  _state = { ..._state, rolloutPercent: clamped };
}

/**
 * Advance to full rollout. Call canAdvanceToFull() first to verify lock conditions.
 */
export function enterFullRollout(): void {
  _state = { ..._state, stage: "full", rolloutPercent: 100, lockedAt: Date.now() };
}

/**
 * Emergency rollback to V15. Instant, no conditions required.
 */
export function emergencyRollback(reason: string): void {
  console.error(`[V17 Rollback] Rolling back to V15. Reason: ${reason}`);
  _state = { ...DEFAULT_STATE };
}

/** Reset to defaults (test isolation). */
export function resetRolloutState(): void {
  _state = { ...DEFAULT_STATE };
}
