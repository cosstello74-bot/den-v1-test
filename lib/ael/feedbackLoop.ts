import type { GeoSignal } from "@/lib/geo/geoSignals";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackRecord = {
  pageSlug:        string;
  generatedAt:     string;
  evaluatedAt:     string;
  sessions:        number;
  quizConversions: number;
  conversionRate:  number;
  avgScrollDepth:  number;
  faqEngagement:   number; // avg FAQ interactions per session
  expansionScore:  number; // 0-100 composite success metric
};

export type FeedbackState = {
  confidenceThreshold: number; // 0-1, adjusts based on success
  expansionRecords:    FeedbackRecord[];
  avgExpansionScore:   number;
  lastEvaluated:       string;
  thresholdAdjustments: Array<{
    timestamp:    string;
    oldThreshold: number;
    newThreshold: number;
    reason:       string;
  }>;
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

const WEIGHTS = {
  conversionRate: 0.40, // normalised against 0.20 target
  scrollDepth:    0.25, // normalised against 80% target
  faqEngagement:  0.20, // normalised against 2 interactions target
  sessionVolume:  0.15, // normalised against 50 sessions target
};

function computeExpansionScore(record: Omit<FeedbackRecord, "expansionScore" | "evaluatedAt" | "generatedAt">): number {
  const convScore    = Math.min((record.conversionRate / 0.20) * 100, 100);
  const scrollScore  = Math.min((record.avgScrollDepth / 80) * 100, 100);
  const faqScore     = Math.min((record.faqEngagement  / 2) * 100, 100);
  const volumeScore  = Math.min((record.sessions        / 50) * 100, 100);

  return Math.round(
    convScore   * WEIGHTS.conversionRate +
    scrollScore * WEIGHTS.scrollDepth   +
    faqScore    * WEIGHTS.faqEngagement +
    volumeScore * WEIGHTS.sessionVolume
  );
}

// ─── Threshold adaptation ─────────────────────────────────────────────────────

const THRESHOLD_MIN = 0.80;
const THRESHOLD_MAX = 0.95;
const THRESHOLD_STEP = 0.02;

/**
 * Adjust confidence threshold based on expansion track record.
 * High success → lower threshold (expand more aggressively)
 * Low success  → raise threshold (be more conservative)
 */
function adaptThreshold(state: FeedbackState): FeedbackState {
  if (state.expansionRecords.length < 3) return state; // need enough data

  const currentAvg = state.avgExpansionScore;
  let newThreshold = state.confidenceThreshold;
  let reason = "";

  if (currentAvg >= 70 && state.confidenceThreshold > THRESHOLD_MIN) {
    newThreshold = Math.max(state.confidenceThreshold - THRESHOLD_STEP, THRESHOLD_MIN);
    reason = `Avg expansion score ${currentAvg} ≥ 70. Lowering threshold to expand more aggressively.`;
  } else if (currentAvg < 40 && state.confidenceThreshold < THRESHOLD_MAX) {
    newThreshold = Math.min(state.confidenceThreshold + THRESHOLD_STEP, THRESHOLD_MAX);
    reason = `Avg expansion score ${currentAvg} < 40. Raising threshold to be more conservative.`;
  }

  if (newThreshold === state.confidenceThreshold) return state;

  return {
    ...state,
    confidenceThreshold: newThreshold,
    thresholdAdjustments: [
      ...state.thresholdAdjustments,
      {
        timestamp:    new Date().toISOString(),
        oldThreshold: state.confidenceThreshold,
        newThreshold,
        reason,
      },
    ],
  };
}

// ─── Main functions ───────────────────────────────────────────────────────────

export function evaluateExpansions(
  signals:        GeoSignal[],
  pageSlugs:      string[],
  generatedAts:   Record<string, string>, // slug → createdAt
  state:          FeedbackState
): FeedbackState {
  const now = new Date().toISOString();

  const newRecords: FeedbackRecord[] = pageSlugs.map((slug) => {
    const pageSignals = signals.filter((s) => s.category === slug || s.sessionId.startsWith(slug));
    const sessions    = pageSignals.length;
    const conversions = pageSignals.filter((s) => s.convertedToQuiz).length;
    const convRate    = sessions > 0 ? conversions / sessions : 0;
    const avgScroll   = sessions > 0
      ? pageSignals.reduce((s, v) => s + v.scrollDepth, 0) / sessions
      : 0;
    const avgFaq      = sessions > 0
      ? pageSignals.reduce((s, v) => s + v.faqInteractions, 0) / sessions
      : 0;

    const scoreInput = {
      pageSlug:        slug,
      sessions,
      quizConversions: conversions,
      conversionRate:  convRate,
      avgScrollDepth:  avgScroll,
      faqEngagement:   avgFaq,
    };

    return {
      ...scoreInput,
      generatedAt:    generatedAts[slug] ?? now,
      evaluatedAt:    now,
      expansionScore: computeExpansionScore(scoreInput),
    };
  });

  const combined = [
    ...state.expansionRecords.filter((r) => !pageSlugs.includes(r.pageSlug)),
    ...newRecords,
  ];

  const avgScore = combined.length > 0
    ? Math.round(combined.reduce((s, r) => s + r.expansionScore, 0) / combined.length)
    : 0;

  const updated: FeedbackState = {
    ...state,
    expansionRecords: combined,
    avgExpansionScore: avgScore,
    lastEvaluated: now,
  };

  return adaptThreshold(updated);
}

export function initFeedbackState(): FeedbackState {
  return {
    confidenceThreshold:  0.85,
    expansionRecords:     [],
    avgExpansionScore:    0,
    lastEvaluated:        new Date().toISOString(),
    thresholdAdjustments: [],
  };
}
