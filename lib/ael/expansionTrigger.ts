/**
 * v4 Expansion Trigger.
 *
 * Evaluates WHEN the AEL system should expand.
 *
 * Three gate layers — ALL must pass for an intent to be approved:
 *   1. Confidence gate (always applied): confidence ≥ minConfidence
 *   2. Duplicate gate: slug not already in existingPageSlugs
 *   3. Signal gate (seed mode waived):
 *        event-driven: frequency ≥ minFrequency
 *                      conversionRate ≥ minConvRate (waived if frequency ≥ highFreqBypass)
 *        seed mode:    all vocabulary intents with passing confidence are approved
 *
 * Mode detection: if ALL intents have frequency === 0, system operates in seed mode.
 */

import type { MinedIntent }        from "./intentMiningEngine";
import type { DiscoveredCategory } from "./categoryDiscoveryEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TriggerMode = "seed" | "event-driven";

export type TriggerDecision = {
  shouldExpand:       boolean;
  mode:               TriggerMode;
  reason:             string;
  approvedIntents:    MinedIntent[];
  approvedCategories: DiscoveredCategory[];
  rejectedIntents:    Array<{ intent: MinedIntent;        reason: string }>;
  rejectedCategories: Array<{ category: DiscoveredCategory; reason: string }>;
};

export type TriggerConfig = {
  /** Minimum confidence for any intent/category to be approved. Default: 0.85 */
  minConfidence:   number;
  /** Minimum event frequency for event-driven mode. Default: 3 */
  minFrequency:    number;
  /** Minimum conversion rate for event-driven mode. Default: 0.05 */
  minConvRate:     number;
  /** Frequency above which conversion rate gate is waived. Default: 15 */
  highFreqBypass:  number;
  /** Max new pages to approve per build run. Default: 10 */
  maxNewPages:     number;
};

export const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  minConfidence:  0.85,
  minFrequency:   3,
  minConvRate:    0.05,
  highFreqBypass: 15,
  maxNewPages:    10,
};

// ─── Main function ────────────────────────────────────────────────────────────

export function evaluateExpansionTrigger(
  intents:           MinedIntent[],
  categories:        DiscoveredCategory[],
  existingPageSlugs: string[],
  existingCatIds:    string[],
  cfg:               TriggerConfig = DEFAULT_TRIGGER_CONFIG
): TriggerDecision {
  const isSeedMode = intents.length === 0 || intents.every((i) => i.frequency === 0);
  const mode: TriggerMode = isSeedMode ? "seed" : "event-driven";

  const approvedIntents:    MinedIntent[]                                     = [];
  const rejectedIntents:    Array<{ intent: MinedIntent; reason: string }>    = [];
  const approvedCategories: DiscoveredCategory[]                              = [];
  const rejectedCategories: Array<{ category: DiscoveredCategory; reason: string }> = [];

  // ── Evaluate intents ───────────────────────────────────────────────────────

  for (const intent of intents) {
    // Gate 1 — duplicate check
    if (existingPageSlugs.includes(intent.slug)) {
      rejectedIntents.push({ intent, reason: "page already exists" });
      continue;
    }

    // Gate 2 — confidence
    if (intent.confidence < cfg.minConfidence) {
      rejectedIntents.push({
        intent,
        reason: `confidence ${intent.confidence.toFixed(2)} < threshold ${cfg.minConfidence}`,
      });
      continue;
    }

    // Gate 3 — signal (waived in seed mode)
    if (!isSeedMode) {
      if (intent.frequency < cfg.minFrequency) {
        rejectedIntents.push({
          intent,
          reason: `frequency ${intent.frequency} < minimum ${cfg.minFrequency}`,
        });
        continue;
      }

      const convRateOk = intent.conversionRate >= cfg.minConvRate;
      const highVolOk  = intent.frequency >= cfg.highFreqBypass;
      if (!convRateOk && !highVolOk) {
        rejectedIntents.push({
          intent,
          reason: `conversionRate ${intent.conversionRate.toFixed(3)} < ${cfg.minConvRate} and frequency ${intent.frequency} < bypass ${cfg.highFreqBypass}`,
        });
        continue;
      }
    }

    approvedIntents.push(intent);
  }

  // ── Evaluate categories ────────────────────────────────────────────────────

  for (const cat of categories) {
    if (existingCatIds.includes(cat.id)) {
      rejectedCategories.push({ category: cat, reason: "category already exists" });
      continue;
    }

    if (cat.confidence < cfg.minConfidence) {
      rejectedCategories.push({
        category: cat,
        reason: `confidence ${cat.confidence.toFixed(2)} < threshold ${cfg.minConfidence}`,
      });
      continue;
    }

    approvedCategories.push(cat);
  }

  // ── Cap new pages ──────────────────────────────────────────────────────────

  const cappedIntents = approvedIntents.slice(0, cfg.maxNewPages);

  // ── Decision ───────────────────────────────────────────────────────────────

  const shouldExpand = cappedIntents.length > 0 || approvedCategories.length > 0;

  const parts: string[] = [`[${mode.toUpperCase()}]`];
  if (cappedIntents.length > 0) {
    parts.push(`${cappedIntents.length} intent(s) approved for page generation.`);
  }
  if (approvedCategories.length > 0) {
    parts.push(`${approvedCategories.length} category cluster(s) approved.`);
  }
  if (!shouldExpand) {
    parts.push(
      `No expansion: ${rejectedIntents.length} intent(s) rejected,`,
      `${rejectedCategories.length} category cluster(s) rejected.`
    );
  }

  return {
    shouldExpand,
    mode,
    reason:             parts.join(" "),
    approvedIntents:    cappedIntents,
    approvedCategories,
    rejectedIntents,
    rejectedCategories,
  };
}
