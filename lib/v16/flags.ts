/**
 * V16 feature flags.
 *
 * Progressive rollout switches for each V16 layer. All flags default OFF
 * so the system is safe to deploy before any V16 layer is activated.
 *
 * Enable via environment variables (server) or localStorage key
 * "den_v16_flags" (client, JSON object) for local development overrides.
 *
 * Flag precedence: env > localStorage > default.
 */

// ─── Flag definitions ─────────────────────────────────────────────────────────

export type V16Flags = {
  /** Phase 1: use CategoryPlugin registry instead of v15 profiles directly. */
  USE_V16_PLUGINS:         boolean;
  /** Phase 2: use ScoringOrchestrator for structured score decomposition. */
  USE_V16_ORCHESTRATOR:    boolean;
  /** Phase 3: use pureRanker instead of inline sort in compositeRanking. */
  USE_V16_RANKER:          boolean;
  /** Phase 4/5: route revenue enrichment through applyMonetisation layer. */
  USE_V16_MONETISATION:    boolean;
  /** Run both V15 and V16 ranking in parallel and log diffs. */
  ENABLE_SHADOW_RANKING:   boolean;
  /** Run V16 guardrail suite on each ranking call; throw on violation. */
  ENABLE_GUARDRAILS:       boolean;
  /** Emit observability events to the in-memory event collector. */
  ENABLE_OBSERVABILITY:    boolean;
};

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: V16Flags = {
  USE_V16_PLUGINS:         false,
  USE_V16_ORCHESTRATOR:    false,
  USE_V16_RANKER:          false,
  USE_V16_MONETISATION:    false,
  ENABLE_SHADOW_RANKING:   false,
  ENABLE_GUARDRAILS:       false,
  ENABLE_OBSERVABILITY:    false,
};

// ─── Env overrides ────────────────────────────────────────────────────────────

function fromEnv(): Partial<V16Flags> {
  if (typeof process === "undefined") return {};
  const overrides: Partial<V16Flags> = {};

  const keys = Object.keys(DEFAULTS) as Array<keyof V16Flags>;
  for (const key of keys) {
    const val = process.env[`NEXT_PUBLIC_V16_${key}`];
    if (val === "true")  overrides[key] = true;
    if (val === "false") overrides[key] = false;
  }
  return overrides;
}

// ─── localStorage overrides (client only, dev convenience) ───────────────────

function fromStorage(): Partial<V16Flags> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("den_v16_flags");
    if (!raw) return {};
    return JSON.parse(raw) as Partial<V16Flags>;
  } catch {
    return {};
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _cache: V16Flags | null = null;

/** Get the current V16 flag snapshot. Cached after first call. */
export function getFlags(): V16Flags {
  if (_cache) return _cache;
  _cache = { ...DEFAULTS, ...fromEnv(), ...fromStorage() };
  return _cache;
}

/** Get a single flag value. */
export function flag(key: keyof V16Flags): boolean {
  return getFlags()[key];
}

/** Reset flag cache (use in tests or after localStorage write). */
export function resetFlagCache(): void {
  _cache = null;
}
