"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeoSignal = {
  sessionId:                  string;
  category:                   string;
  timestamp:                  number;
  scrollDepth:                number; // 0-100 %
  comparisonTableViews:       number;
  faqInteractions:            number;
  timeOnStructuredSections:   number; // ms
  convertedToQuiz:            boolean;
};

type SectionName = "summary" | "comparison" | "decision" | "entities" | "faq";

// ─── In-memory session accumulator ────────────────────────────────────────────

let _signal: GeoSignal | null = null;
let _sectionTimers: Partial<Record<SectionName, number>> = {};

function getOrCreateSignal(category: string): GeoSignal {
  if (_signal) return _signal;
  _signal = {
    sessionId:                 Math.random().toString(36).slice(2),
    category,
    timestamp:                 Date.now(),
    scrollDepth:               0,
    comparisonTableViews:      0,
    faqInteractions:           0,
    timeOnStructuredSections:  0,
    convertedToQuiz:           false,
  };
  return _signal;
}

// ─── Scroll depth tracking ────────────────────────────────────────────────────

export function initScrollTracking(category: string): () => void {
  if (typeof window === "undefined") return () => {};
  const signal = getOrCreateSignal(category);

  const handler = () => {
    const scrolled = window.scrollY + window.innerHeight;
    const total    = document.documentElement.scrollHeight;
    signal.scrollDepth = Math.max(signal.scrollDepth, Math.round((scrolled / total) * 100));
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

// ─── Section entry/exit tracking ─────────────────────────────────────────────

export function trackSectionEnter(section: SectionName): void {
  _sectionTimers[section] = Date.now();
}

export function trackSectionExit(section: SectionName): void {
  const start = _sectionTimers[section];
  if (!start || !_signal) return;
  _signal.timeOnStructuredSections += Date.now() - start;
  delete _sectionTimers[section];
}

// ─── Interaction events ───────────────────────────────────────────────────────

export function trackComparisonTableView(category: string): void {
  getOrCreateSignal(category).comparisonTableViews += 1;
}

export function trackFaqInteraction(category: string): void {
  getOrCreateSignal(category).faqInteractions += 1;
}

export function trackQuizConversion(category: string): void {
  getOrCreateSignal(category).convertedToQuiz = true;
}

// ─── Flush to API ─────────────────────────────────────────────────────────────

export async function flushGeoSignal(): Promise<void> {
  if (!_signal) return;
  const payload = { ..._signal };
  try {
    await fetch("/api/geo/signals", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
  } catch {
    // Best-effort — do not block user
  }
}
