"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { getRecommendations } from "@/lib/recommendByCategory";
import { getStoredEvents, logEvent, flushPendingEvents } from "@/lib/eventLogger";
import { detectSegment } from "@/lib/segment";
import { CATEGORY_META, isValidCategory } from "@/lib/category";
import { applyCompositeRanking } from "@/lib/compositeRanking";
import type { Recommendation } from "@/types/product";
import type { IntelligenceModel } from "@/lib/learningEngine";
import type { TruthModel, ProductTruth } from "@/lib/truthModel";
import type { RevenueModelSnapshot } from "@/lib/metrics/revenueMetrics";
import type { RevenueEnrichedRecommendation } from "@/lib/compositeRanking";
import { collectParams } from "@/lib/v15/inputLayer";
import { interpretParams } from "@/lib/v15/categoryScoring";
import { computeAdjustmentMap, applyBehaviourAdjustment } from "@/lib/learning/learningEngine";
import { getSession, saveQuizAnswers, recordProductView, recordAffiliateClick, isReturningUser, sessionToSignalEvents } from "@/lib/session/sessionMemory";
import { trackImpression, trackAffiliateClick, trackResultView, getBehaviorProfile } from "@/lib/analytics/liteAnalytics";
import seedIntelligence from "@/data/intelligenceModel.json";
import seedTruth        from "@/data/truthModel.json";
import seedRevenue      from "@/data/revenueModel.json";

// ─── Design tokens ───────────────────────────────────────────────────────────

const RANK_LABELS    = ["Best Match", "Strong Match", "Solid Option"];
const RANK_SUBTITLES = [
  "Highest overall match for your profile",
  "Great fit with minor trade-offs",
  "Reliable alternative worth considering",
];

const SEGMENT_LABELS: Record<string, string> = {
  student:      "Great for Students",
  gamer:        "Built for Gamers",
  professional: "Ideal for Professionals",
  creator:      "Perfect for Creators",
  general:      "Versatile Choice",
};

const PRICE_BAND_LABELS: Record<string, string> = {
  budget:  "Budget",
  mid:     "Mid-range",
  high:    "High-end",
  premium: "Premium",
};

const PRICE_BAND_COLORS: Record<string, string> = {
  budget:  "text-emerald-400 bg-emerald-950/50 border-emerald-800/50",
  mid:     "text-gray-400 bg-gray-800/60 border-gray-700",
  high:    "text-indigo-400 bg-indigo-950/50 border-indigo-800/50",
  premium: "text-amber-400 bg-amber-950/50 border-amber-800/50",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const w = Math.min(score, 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full score-bar"
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="text-sm font-bold text-indigo-400 w-10 text-right tabular-nums shrink-0">
        {score}
      </span>
    </div>
  );
}

function TruthBadge({ truth }: { truth: ProductTruth | undefined }) {
  if (!truth) return null;
  const pct    = Math.round(truth.truth_score * 100);
  const isHigh = truth.truth_score >= 0.7;
  const isMid  = truth.truth_score >= 0.5;
  const cls    = isHigh
    ? "text-emerald-400 bg-emerald-950/50 border-emerald-800/50"
    : isMid
    ? "text-indigo-400 bg-indigo-950/50 border-indigo-800/50"
    : "text-amber-400 bg-amber-950/50 border-amber-800/50";
  const label  = isHigh ? "Verified" : isMid ? "Mixed signals" : "Sparse data";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {pct}% truth · {label}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 1.0)
    return <span className="text-[11px] font-semibold text-emerald-400">● High Confidence</span>;
  if (confidence >= 0.8)
    return <span className="text-[11px] font-semibold text-indigo-400">● Growing Data</span>;
  return <span className="text-[11px] font-semibold text-gray-600">● Early Signals</span>;
}

function SegmentBadge({ segment }: { segment: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold text-gray-500 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-full">
      {SEGMENT_LABELS[segment] ?? "Good Match"}
    </span>
  );
}

// Input layer is a pure passthrough — no interpretation here.
// All category-native signal mapping happens in lib/v15/categoryScoring.ts.

// ─── Main page ────────────────────────────────────────────────────────────────

function ResultsContent() {
  const params     = useSearchParams();
  const rawCat     = params.get("category") ?? "laptops";
  const category   = isValidCategory(rawCat) ? rawCat : "laptops";
  const meta       = CATEGORY_META[category];
  // V15 INPUT LAYER: pure passthrough — no category logic here
  const rawParams  = collectParams(params);
  // V15 SCORING LAYER: interpretation happens in categoryScoring.ts
  const signals    = interpretParams(rawParams, category);
  const segment    = detectSegment(signals.purpose);

  const [results, setResults]           = useState<RevenueEnrichedRecommendation[]>(() => {
    const base = getRecommendations(
      category, rawParams, [],
      seedIntelligence as IntelligenceModel,
      seedTruth as TruthModel
    );
    return applyCompositeRanking(base, seedRevenue as RevenueModelSnapshot, {
      user: signals,
      trafficSource: "unknown",
    });
  });
  const [truthModel, setTruthModel]     = useState<TruthModel>(seedTruth as TruthModel);
  const [intelligence, setIntelligence] = useState<IntelligenceModel>(seedIntelligence as IntelligenceModel);
  const [returning, setReturning]       = useState(false);
  const [, setSynced]                   = useState(false);

  useEffect(() => {
    const run = async () => {
      // ── v2: session memory + lite analytics ────────────────────────────────
      setReturning(isReturningUser());
      saveQuizAnswers(rawParams);
      trackResultView();

      // ── Live model fetch ────────────────────────────────────────────────────
      let liveIntelligence: IntelligenceModel   = seedIntelligence as IntelligenceModel;
      let liveTruth: TruthModel                  = seedTruth as TruthModel;
      let liveRevenue: RevenueModelSnapshot      = seedRevenue as RevenueModelSnapshot;

      try {
        const [intRes, truthRes, revRes] = await Promise.all([
          fetch("/api/events/batch"),
          fetch("/api/truthModel"),
          fetch("/api/revenue"),
        ]);
        if (intRes.ok)   liveIntelligence = (await intRes.json()) as IntelligenceModel;
        if (truthRes.ok) {
          liveTruth = (await truthRes.json()) as TruthModel;
          setTruthModel(liveTruth);
        }
        if (revRes.ok)   liveRevenue = (await revRes.json()) as RevenueModelSnapshot;
      } catch { /* fall back to seed */ }

      setIntelligence(liveIntelligence);

      // ── v2: behaviour adjustment from session signals ───────────────────────
      const session         = getSession();
      const signalEvents    = sessionToSignalEvents(session);
      const adjustmentMap   = computeAdjustmentMap(signalEvents);

      const localEvents = getStoredEvents();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapted     = localEvents as any[];
      const base        = getRecommendations(category, rawParams, adapted, liveIntelligence, liveTruth);
      const composite   = applyCompositeRanking(base, liveRevenue, {
        user: signals,
        trafficSource: document.referrer.includes("google") ? "organic_search"
                     : document.referrer.includes("facebook") || document.referrer.includes("twitter") ? "social"
                     : document.referrer ? "referral"
                     : "direct",
      });

      // Apply v2 behaviour layer (10% weight — biases from session memory)
      const learned = applyBehaviourAdjustment(composite, adjustmentMap);
      setResults(learned);

      // ── Event logging ───────────────────────────────────────────────────────
      logEvent("results_viewed", category, { purpose: signals.purpose, budget: signals.budget });
      learned.forEach((rec) => {
        logEvent("product_viewed", category, {
          productId: rec.product.id,
          purpose:   signals.purpose,
          metadata:  { rank: rec.rank },
        });
        // v2: session memory + lite analytics impression tracking
        recordProductView(rec.product.id);
        trackImpression(rec.product.id);
      });

      const { synced: n } = await flushPendingEvents();
      if (n > 0) setSynced(true);
    };

    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800/40 sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
          <span className="text-sm font-semibold text-white">DEN</span>
        </Link>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <Link href={`/${category}`} className="hover:text-gray-300 transition-colors capitalize">
            {category} →
          </Link>
        </div>
      </nav>

      <main className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-10">

          {/* ── Header ───────────────────────────────────────── */}
          <div className="animate-fade-in space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold tracking-widest text-indigo-400 uppercase">{meta.label}</span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-500 font-medium">{SEGMENT_LABELS[segment]}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Your ranked picks</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Ranked against real purchase outcomes for people with your profile. No sponsored results.
            </p>
          </div>

          {/* ── Product cards ─────────────────────────────────── */}
          <div className="space-y-5">
            {results.map((rec, index) => {
              const isBest = index === 0;
              const truth  = (truthModel.products as Record<string, ProductTruth>)[rec.product.id];

              return (
                <article
                  key={rec.product.id}
                  className={`
                    relative rounded-2xl border overflow-hidden
                    animate-slide-up transition-all duration-200
                    hover:-translate-y-0.5
                    ${isBest
                      ? "border-indigo-500/60 shadow-2xl shadow-indigo-900/20"
                      : "border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-black/30"
                    }
                  `}
                  style={{ animationDelay: `${index * 130}ms` }}
                >
                  <div className={`p-6 space-y-5 ${isBest ? "bg-indigo-950/20" : "bg-gray-900"}`}>

                    {/* Rank label */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${isBest ? "text-indigo-400" : "text-gray-600"}`}>
                            {RANK_LABELS[index] ?? `Option ${index + 1}`}
                          </span>
                          {isBest && (
                            <span className="inline-flex text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                              Best Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600">{RANK_SUBTITLES[index]}</p>
                      </div>

                      {/* Price band badge */}
                      <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${PRICE_BAND_COLORS[rec.product.price_band] ?? PRICE_BAND_COLORS.mid}`}>
                        {PRICE_BAND_LABELS[rec.product.price_band] ?? rec.product.price_band}
                      </span>
                    </div>

                    {/* Product name */}
                    <div>
                      <h2 className={`font-bold leading-tight tracking-tight ${isBest ? "text-2xl text-white" : "text-xl text-gray-100"}`}>
                        {rec.product.name}
                      </h2>
                      <p className="text-xs text-gray-600 mt-0.5">{rec.product.brand}</p>
                    </div>

                    {/* Score bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">
                          Match Score
                        </span>
                        <ConfidenceBadge confidence={truth?.confidence ?? 1.0} />
                      </div>
                      <ScoreBar score={rec.score} />
                    </div>

                    {/* Dimension scores mini bar row */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { key: "battery_score",     label: "Battery",       val: rec.product.battery_score },
                        { key: "portability_score",  label: "Portable",     val: rec.product.portability_score },
                        { key: "gaming_score",       label: "Gaming",        val: rec.product.gaming_score },
                        { key: "productivity_score", label: "Productivity",  val: rec.product.productivity_score },
                        { key: "value_score",        label: "Value",         val: rec.product.value_score },
                      ].map(({ key, label, val }) => (
                        <div key={key} className="text-center space-y-1.5">
                          <div className="h-12 bg-gray-800 rounded-lg overflow-hidden flex flex-col-reverse mx-auto w-full">
                            <div
                              className="bg-indigo-600/60 w-full rounded-b-lg transition-none"
                              style={{ height: `${val}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-gray-600 font-medium leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Truth + Segment badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <TruthBadge truth={truth} />
                      <SegmentBadge segment={segment} />
                    </div>

                    {/* Strengths */}
                    {rec.strengths.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold">
                          Why This Matches You
                        </p>
                        <ul className="space-y-1.5">
                          {rec.strengths.map((s) => (
                            <li key={s} className="flex items-center gap-2.5 text-sm text-gray-300">
                              <span className="w-4 h-4 rounded-full bg-indigo-950/70 border border-indigo-800/60 flex items-center justify-center text-indigo-400 text-[9px] shrink-0 font-bold">
                                ✓
                              </span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <a
                      href={rec.product.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        logEvent("affiliate_clicked", category, {
                          productId: rec.product.id,
                          purpose:   signals.purpose,
                          metadata:  { rank: rec.rank },
                        });
                        // v2: session memory + lite analytics
                        recordAffiliateClick(rec.product.id);
                        trackAffiliateClick(rec.product.id);
                      }}
                      className={`
                        flex items-center justify-center gap-2 w-full font-semibold rounded-xl px-6 py-3.5
                        transition-all duration-150 active:scale-[0.98] text-sm
                        ${isBest
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white"
                        }
                      `}
                    >
                      Check Current Price
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ── v2: Returning user indicator ──────────────────── */}
          {returning && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 rounded-xl px-4 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              Rankings personalised from your previous session
            </div>
          )}

          {/* ── v2: Trending based on users like you ──────────── */}
          {(() => {
            const trending = results.filter(
              (rec) => intelligence.products[rec.product.id]?.trend === "rising"
            );
            if (trending.length === 0) return null;
            return (
              <div className="animate-fade-in space-y-3 border-t border-gray-800/50 pt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                  Trending with {SEGMENT_LABELS[segment].toLowerCase()} users
                </p>
                <div className="flex flex-wrap gap-2">
                  {trending.map((rec) => (
                    <div
                      key={rec.product.id}
                      className="flex items-center gap-2 bg-gray-900 border border-emerald-900/40 rounded-xl px-3.5 py-2"
                    >
                      <span className="text-[10px] font-bold text-emerald-400">↑</span>
                      <span className="text-xs text-gray-300">{rec.product.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Footer links ──────────────────────────────────── */}
          <div className="animate-fade-in delay-500 text-center space-y-3 pt-2 border-t border-gray-800/50 pt-8">
            <Link
              href={`/quiz?category=${category}`}
              className="block text-sm text-gray-500 hover:text-indigo-400 transition-colors"
            >
              ← Retake quiz for {meta.label}
            </Link>
            <Link
              href="/"
              className="block text-sm text-gray-600 hover:text-gray-400 transition-colors"
            >
              Explore other categories
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full spinner mx-auto" />
            <p className="text-gray-500 text-sm">Calculating your matches…</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
