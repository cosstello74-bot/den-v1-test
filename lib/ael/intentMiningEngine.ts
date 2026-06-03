/**
 * v4 Intent Mining Engine.
 *
 * Extracts search intents from raw event data:
 *   - Quiz answer combinations (purpose + budget from question_answered)
 *   - Product click sequences (product_clicked → affiliate_clicked)
 *
 * Outputs MinedIntent[] ranked by conversion potential.
 * Falls back to empty array when no events present (seed mode).
 */

import type { Event }       from "@/types/event";
import type { CategoryKey } from "@/types/product";
import type { IntentSignal } from "./intentDiscovery";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MinedIntent = {
  key:             string;         // normalized key e.g. "gaming_mid"
  slug:            string;         // candidate URL slug
  category:        CategoryKey;
  frequency:       number;         // sessions containing this pattern
  conversionRate:  number;         // quiz-completed → affiliate-clicked rate
  confidence:      number;         // 0-1 derived from frequency + conversion
  sourceSessions:  string[];       // contributing session IDs
  quizMapping:     { purpose?: string; budget?: string };
};

// ─── Normalisation tables ─────────────────────────────────────────────────────

const PURPOSE_TO_KEY: Record<string, string> = {
  gaming:     "gaming",
  work:       "professional",
  university: "student",
  creative:   "creative",
};

const BUDGET_TO_KEY: Record<string, string> = {
  "under-500":  "budget",
  "500-1000":   "mid",
  "1000-1500":  "high",
  "1500+":      "premium",
};

function buildSlug(purposeKey: string, budgetKey?: string): string {
  const combinations: Record<string, string> = {
    "gaming_budget":           "best-budget-gaming-laptops-under-500",
    "gaming_mid":              "best-gaming-laptops-under-1000",
    "gaming_high":             "best-high-end-gaming-laptops",
    "gaming_premium":          "best-premium-gaming-laptops",
    "gaming_any":              "best-gaming-laptops",
    "student_budget":          "best-budget-laptops-for-students",
    "student_mid":             "best-mid-range-student-laptops",
    "student_any":             "best-laptops-for-students",
    "professional_budget":     "best-budget-work-laptops",
    "professional_mid":        "best-laptops-for-work",
    "professional_high":       "best-professional-laptops",
    "professional_premium":    "best-premium-laptops-for-professionals",
    "professional_any":        "best-laptops-for-work",
    "creative_budget":         "best-budget-creative-laptops",
    "creative_mid":            "best-laptops-for-creative-work",
    "creative_high":           "best-laptops-for-video-editing",
    "creative_premium":        "best-premium-creative-laptops",
    "creative_any":            "best-laptops-for-creative-work",
  };

  const lookup = budgetKey ? `${purposeKey}_${budgetKey}` : `${purposeKey}_any`;
  return combinations[lookup] ?? `best-${purposeKey}-laptops`;
}

function buildIntentKey(purposeKey: string, budgetKey?: string): string {
  return `${purposeKey}_${budgetKey ?? "any"}`;
}

// ─── Session grouping ─────────────────────────────────────────────────────────

type SessionData = {
  sessionId:        string;
  category:         string;
  purpose?:         string;
  budget?:          string;
  quizCompleted:    boolean;
  affiliateClicked: boolean;
};

function groupBySession(events: Event[]): SessionData[] {
  const map: Record<string, SessionData> = {};

  for (const e of events) {
    if (!map[e.sessionId]) {
      map[e.sessionId] = {
        sessionId:        e.sessionId,
        category:         e.category ?? "laptops",
        quizCompleted:    false,
        affiliateClicked: false,
      };
    }

    const s = map[e.sessionId];

    if (e.type === "question_answered" && e.metadata) {
      const q = e.metadata.question as string | undefined;
      const a = e.metadata.answer   as string | undefined;
      if (q === "purpose" && a) s.purpose = a;
      if (q === "budget"  && a) s.budget  = a;
    }
    if (e.type === "quiz_completed")    s.quizCompleted    = true;
    if (e.type === "affiliate_clicked") s.affiliateClicked = true;
  }

  return Object.values(map);
}

// ─── Main function ────────────────────────────────────────────────────────────

export function mineIntents(
  events:            Event[],
  existingPageSlugs: string[]
): MinedIntent[] {
  if (events.length === 0) return [];

  const sessions = groupBySession(events);

  // Bucket sessions by normalised purpose + budget key
  const buckets: Record<string, { sessions: SessionData[]; conversions: number }> = {};

  for (const s of sessions) {
    if (!s.purpose) continue;

    const pKey = PURPOSE_TO_KEY[s.purpose] ?? s.purpose;
    const bKey = s.budget ? BUDGET_TO_KEY[s.budget] : undefined;
    const key  = buildIntentKey(pKey, bKey);

    if (!buckets[key]) buckets[key] = { sessions: [], conversions: 0 };
    buckets[key].sessions.push(s);
    if (s.quizCompleted && s.affiliateClicked) buckets[key].conversions++;
  }

  const results: MinedIntent[] = [];

  for (const [key, bucket] of Object.entries(buckets)) {
    const frequency      = bucket.sessions.length;
    const conversionRate = frequency > 0
      ? Math.round((bucket.conversions / frequency) * 1000) / 1000
      : 0;

    // Confidence: frequency component (saturates at 50) + conversion component (saturates at 20%)
    const freqNorm = Math.min(frequency / 50, 1.0);
    const convNorm = Math.min(conversionRate / 0.20, 1.0);
    const confidence = Math.round((freqNorm * 0.55 + convNorm * 0.45) * 100) / 100;

    const [pKey, bKey] = key.split("_");
    const purposeOrig  = Object.entries(PURPOSE_TO_KEY).find(([, v]) => v === pKey)?.[0] ?? pKey;
    const budgetOrig   = bKey && bKey !== "any"
      ? Object.entries(BUDGET_TO_KEY).find(([, v]) => v === bKey)?.[0]
      : undefined;

    const slug     = buildSlug(pKey, bKey !== "any" ? bKey : undefined);
    const category = (bucket.sessions[0]?.category ?? "laptops") as CategoryKey;

    if (existingPageSlugs.includes(slug)) continue;

    results.push({
      key,
      slug,
      category,
      frequency,
      conversionRate,
      confidence,
      sourceSessions: bucket.sessions.map((s) => s.sessionId),
      quizMapping:    { purpose: purposeOrig, budget: budgetOrig },
    });
  }

  // Sort by confidence × log(frequency + 1) — rewards both signal quality and volume
  return results.sort((a, b) => {
    const sA = a.confidence * Math.log1p(a.frequency);
    const sB = b.confidence * Math.log1p(b.frequency);
    return sB - sA;
  });
}

/**
 * Merge mined (event-driven) intents with vocabulary intents from intentDiscovery.
 * Vocabulary intents are used when events are absent or to extend coverage.
 */
export function mergeWithVocabulary(
  mined:             MinedIntent[],
  vocabulary:        IntentSignal[],
  existingPageSlugs: string[]
): MinedIntent[] {
  const minedSlugs = new Set(mined.map((m) => m.slug));

  const vocabAsMinedIntents: MinedIntent[] = vocabulary
    .filter((v) => !v.hasPage && !existingPageSlugs.includes(v.slug) && !minedSlugs.has(v.slug))
    .map((v): MinedIntent => ({
      key:            v.intent,
      slug:           v.slug,
      category:       v.category,
      frequency:      0,
      conversionRate: 0,
      confidence:     Math.round((v.priority / 100) * 100) / 100,
      sourceSessions: [],
      quizMapping:    {
        purpose: v.quizMapping.purpose,
        budget:  v.quizMapping.budget,
      },
    }));

  return [...mined, ...vocabAsMinedIntents];
}
