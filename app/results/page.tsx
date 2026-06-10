"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { getRecommendations } from "@/lib/recommendByCategory";
import { getStoredEvents, logEvent, flushPendingEvents } from "@/lib/eventLogger";
import { detectSegment } from "@/lib/segment";
import { CATEGORY_META, isValidCategory } from "@/lib/category";
import { applyCompositeRanking } from "@/lib/compositeRanking";
import type { Recommendation } from "@/types/product";
import type { ProductWithMetrics } from "@/types/product";
import type { IntelligenceModel } from "@/lib/learningEngine";
import type { TruthModel, ProductTruth } from "@/lib/truthModel";
import type { RevenueModelSnapshot } from "@/lib/metrics/revenueMetrics";
import type { RevenueEnrichedRecommendation } from "@/lib/compositeRanking";
import { resolveAffiliateUrl } from "@/lib/v4/affiliateResolver";
import { collectParams } from "@/lib/v15/inputLayer";
import { interpretParams } from "@/lib/v15/categoryScoring";
import { runV16Guardrails } from "@/lib/v16/guardrails/guardrailRunner";
import { getObservabilitySnapshot, logSnapshot } from "@/lib/v16/observability/metricsAggregator";
import { recordSignal } from "@/lib/v16/observability/learningSignalStore";
import { computeAdjustmentMap, applyBehaviourAdjustment } from "@/lib/learning/learningEngine";
import { getSession, saveQuizAnswers, recordProductView, recordAffiliateClick, isReturningUser, sessionToSignalEvents } from "@/lib/session/sessionMemory";
import { trackImpression, trackAffiliateClick, trackResultView, getBehaviorProfile } from "@/lib/analytics/liteAnalytics";
import seedIntelligence from "@/data/intelligenceModel.json";
import seedTruth        from "@/data/truthModel.json";
import seedRevenue      from "@/data/revenueModel.json";

// ─── Design tokens ────────────────────────────────────────────────────────────

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
  budget:  "text-emerald-700 bg-emerald-50 border-emerald-200",
  mid:     "text-muted bg-ink/8 border-ink/15",
  high:    "text-accent bg-accent/10 border-accent/30",
  premium: "text-amber-700 bg-amber-50 border-amber-200",
};

// Score bar delay class by rank position
const SCORE_BAR_CLASSES = ["score-bar", "score-bar-600", "score-bar-800"] as const;

const CATEGORY_HUB: Record<string, { href: string; label: string }> = {
  software:          { href: "/software", label: "Software" },
  health:            { href: "/health",   label: "Health" },
  "travel-insurance":{ href: "/travel",   label: "Travel" },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score, variant = 0 }: { score: number; variant?: number }) {
  const barClass = SCORE_BAR_CLASSES[Math.min(variant, 2)];
  const w = Math.min(Math.round(score), 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-ink/12 rounded-full overflow-hidden">
        <div
          className={`h-full bg-accent rounded-full ${barClass}`}
          style={{ width: `${w}%` }}
        />
      </div>
      <span className="text-sm font-bold text-accent w-10 text-right tabular-nums shrink-0">
        {w}
      </span>
    </div>
  );
}

const DIMENSION_LABELS: Record<string, [string, string, string, string, string]> = {
  software:         ["Efficiency",  "Cross-platform", "Performance",  "Productivity", "Value"],
  health:           ["Energy",      "Absorption",     "Effectiveness","Wellness",     "Value"],
  "travel-insurance":["Medical",    "Cancellation",   "Activities",   "Baggage",      "Value"],
};

function DimensionBars({ product, category }: { product: ProductWithMetrics; category: string }) {
  const [batteryLabel, portableLabel, gamingLabel, productivityLabel, valueLabel] =
    DIMENSION_LABELS[category] ?? ["Battery", "Portable", "Gaming", "Productivity", "Value"];
  const dims = [
    { label: batteryLabel,      val: product.battery_score },
    { label: portableLabel,     val: product.portability_score },
    { label: gamingLabel,       val: product.gaming_score },
    { label: productivityLabel, val: product.productivity_score },
    { label: valueLabel,        val: product.value_score },
  ];
  return (
    <div className="space-y-2.5">
      {dims.map(({ label, val }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-[11px] text-muted w-24 shrink-0 leading-none">{label}</span>
          <div className="flex-1 h-1.5 bg-ink/12 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent/40 rounded-full"
              style={{ width: `${Math.min(val, 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-muted w-6 text-right tabular-nums shrink-0">{val}</span>
        </div>
      ))}
    </div>
  );
}

function TruthBadge({ truth }: { truth: ProductTruth | undefined }) {
  if (!truth) return null;
  const pct    = Math.round(truth.truth_score * 100);
  const isHigh = truth.truth_score >= 0.7;
  const isMid  = truth.truth_score >= 0.5;
  const cls    = isHigh
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : isMid
    ? "text-accent bg-accent/10 border-accent/30"
    : "text-amber-700 bg-amber-50 border-amber-200";
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
    return <span className="text-[11px] font-semibold text-emerald-600">● High Confidence</span>;
  if (confidence >= 0.8)
    return <span className="text-[11px] font-semibold text-accent">● Growing Data</span>;
  return <span className="text-[11px] font-semibold text-muted">● Early Signals</span>;
}

// ─── Skeleton (Suspense fallback) ─────────────────────────────────────────────

function ResultsSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-ink/10 sticky top-0 z-20 backdrop-blur-sm bg-paper/90">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-sm font-bold text-white">D</span>
          <span className="text-sm font-semibold text-ink">DEN</span>
        </div>
      </nav>
      <main className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-10">

          {/* Header skeleton */}
          <div className="space-y-2.5 animate-pulse">
            <div className="h-3 w-44 bg-ink/10 rounded-full" />
            <div className="h-9 w-52 bg-ink/10 rounded-lg" />
            <div className="h-3 w-72 bg-ink/10 rounded-full" />
          </div>

          {/* Card skeletons */}
          <div className="space-y-5">
            {[7, 5, 5].map((padding, i) => (
              <div
                key={i}
                className={`bg-paper-soft border border-ink/12 rounded-2xl animate-pulse p-${padding}`}
              >
                <div className="space-y-5 p-1">
                  {/* Rank row */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="h-3 w-24 bg-ink/10 rounded-full" />
                      <div className="h-2.5 w-44 bg-ink/10 rounded-full" />
                    </div>
                    <div className="h-6 w-20 bg-ink/10 rounded-full" />
                  </div>
                  {/* Product name */}
                  <div className={`bg-ink/10 rounded-lg ${i === 0 ? "h-9 w-56" : "h-6 w-44"}`} />
                  {/* Score bar */}
                  <div className="space-y-2">
                    <div className="h-2.5 w-24 bg-ink/10 rounded-full" />
                    <div className="h-2.5 bg-ink/10 rounded-full" />
                  </div>
                  {/* Dimension bars */}
                  <div className="space-y-2.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className="h-2 w-20 bg-ink/10 rounded-full shrink-0" />
                        <div className="flex-1 h-1.5 bg-ink/10 rounded-full" />
                        <div className="h-2 w-5 bg-ink/10 rounded-full" />
                      </div>
                    ))}
                  </div>
                  {/* CTA */}
                  <div className={`h-11 w-full rounded-xl ${i === 0 ? "bg-accent/15" : "bg-ink/10"}`} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── Results content ──────────────────────────────────────────────────────────

function ResultsContent() {
  const params     = useSearchParams();
  const rawCat     = params.get("category") ?? "laptops";
  const category   = isValidCategory(rawCat) ? rawCat : "laptops";
  const meta       = CATEGORY_META[category];
  const rawParams  = collectParams(params);
  const signals    = interpretParams(rawParams, category);
  const segment    = detectSegment(signals.purpose);

  const sessionId = useRef(Math.random().toString(36).slice(2)).current;

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
      setReturning(isReturningUser());
      saveQuizAnswers(rawParams);
      trackResultView();

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

      runV16Guardrails(composite, category, rawParams, { throwOnViolation: false });

      const snapshot = getObservabilitySnapshot(category, composite);
      logSnapshot(snapshot);

      const learned = applyBehaviourAdjustment(composite, adjustmentMap);
      setResults(learned);

      logEvent("results_viewed", category, { purpose: signals.purpose, budget: signals.budget });
      learned.forEach((rec) => {
        logEvent("product_viewed", category, {
          productId: rec.product.id,
          purpose:   signals.purpose,
          metadata:  { rank: rec.rank },
        });
        recordProductView(rec.product.id);
        trackImpression(rec.product.id);
        recordSignal({
          sessionId,
          productId: rec.product.id,
          category,
          type: "view",
          timestamp: Date.now(),
          rank: rec.rank,
        });
      });

      const { synced: n } = await flushPendingEvents();
      if (n > 0) setSynced(true);
    };

    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-ink/10 sticky top-0 z-20 backdrop-blur-sm bg-paper/90">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-sm font-bold text-white" aria-hidden="true">D</span>
          <span className="text-sm font-semibold text-ink">DEN</span>
        </Link>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Link href={CATEGORY_HUB[category]?.href ?? "/electronics"} className="hover:text-ink transition-colors duration-150">
            {CATEGORY_HUB[category]?.label ?? "Electronics"}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{meta.label}</span>
        </div>
      </nav>

      <main className="flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-10">

          {/* ── Page header ───────────────────────────────── */}
          <div className="animate-slide-up space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-bold tracking-widest text-muted uppercase">{CATEGORY_HUB[category]?.label ?? "Electronics"}</span>
              <span className="text-ink/20" aria-hidden="true">·</span>
              <span className="font-bold tracking-widest text-accent uppercase">{meta.label}</span>
              <span className="text-ink/20" aria-hidden="true">·</span>
              <span className="text-muted">{SEGMENT_LABELS[segment] ?? "Your Profile"}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-ink leading-tight">
              Your ranked picks
            </h1>
            <p className="text-sm text-muted leading-relaxed max-w-[50ch]">
              Ranked against real purchase outcomes for your profile. No sponsored results.
            </p>
          </div>

          {/* ── Returning user indicator ──────────────────── */}
          {returning && (
            <div className="flex items-center gap-2 text-xs text-accent bg-accent/8 border border-accent/25 rounded-xl px-4 py-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Rankings personalised from your previous session
            </div>
          )}

          {/* ── Product cards ──────────────────────────────── */}
          <div className="space-y-5">
            {results.map((rec, index) => {
              const isBest = index === 0;
              const truth  = (truthModel.products as Record<string, ProductTruth>)[rec.product.id];

              return (
                <article
                  key={rec.product.id}
                  aria-label={`${RANK_LABELS[index] ?? `Option ${index + 1}`}: ${rec.product.name}`}
                  className={`
                    rounded-2xl border overflow-hidden
                    animate-slide-up transition-all duration-200
                    hover:-translate-y-0.5
                    ${isBest
                      ? "border-accent/30 bg-accent/5 hover:border-accent/50"
                      : "border-ink/12 bg-paper-soft hover:border-ink/20"
                    }
                  `}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={isBest ? "p-7 space-y-6" : "p-5 space-y-5"}>

                    {/* ── Rank row ──────────────────────────── */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${isBest ? "text-accent" : "text-muted"}`}>
                            {RANK_LABELS[index] ?? `Option ${index + 1}`}
                          </span>
                          {isBest && (
                            <span className="inline-flex text-[9px] font-bold uppercase tracking-widest bg-accent text-white px-2 py-0.5 rounded-full">
                              #1
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted">
                          {RANK_SUBTITLES[index] ?? ""}
                        </p>
                      </div>
                      <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${PRICE_BAND_COLORS[rec.product.price_band] ?? PRICE_BAND_COLORS.mid}`}>
                        {PRICE_BAND_LABELS[rec.product.price_band] ?? rec.product.price_band}
                      </span>
                    </div>

                    {/* ── Product name + brand ───────────────── */}
                    <div className="space-y-2">
                      <h2 className={`font-bold tracking-tighter leading-none text-ink ${isBest ? "text-3xl" : "text-xl"}`}>
                        {rec.product.name}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted">{rec.product.brand}</span>
                        {truth && (
                          <>
                            <span className="text-gray-800" aria-hidden="true">·</span>
                            <TruthBadge truth={truth} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Match score ────────────────────────── */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted uppercase tracking-widest font-semibold">
                          Match Score
                        </span>
                        <ConfidenceBadge confidence={truth?.confidence ?? 1.0} />
                      </div>
                      {isBest ? (
                        <div className="flex items-end gap-4">
                          <span className="text-5xl font-bold tracking-tighter text-ink tabular-nums leading-none">
                            {Math.min(Math.round(rec.score), 100)}
                          </span>
                          <div className="flex-1 pb-1.5">
                            <ScoreBar score={rec.score} variant={index} />
                          </div>
                        </div>
                      ) : (
                        <ScoreBar score={rec.score} variant={index} />
                      )}
                    </div>

                    {/* ── Dimension bars ─────────────────────── */}
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">
                        Dimensions
                      </p>
                      <DimensionBars product={rec.product} category={category} />
                    </div>

                    {/* ── Numbered strengths ─────────────────── */}
                    {rec.strengths.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">
                          Why This Matches You
                        </p>
                        <ol className="space-y-2">
                          {rec.strengths.map((s, i) => (
                            <li key={s} className="flex items-start gap-3">
                              <span className="font-mono text-[10px] font-bold text-accent/50 tabular-nums shrink-0 pt-0.5 w-5 leading-none">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="text-sm text-ink leading-snug">{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* ── CTA ────────────────────────────────── */}
                    <a
                      href={resolveAffiliateUrl(rec.product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        logEvent("affiliate_clicked", category, {
                          productId: rec.product.id,
                          purpose:   signals.purpose,
                          metadata:  { rank: rec.rank },
                        });
                        recordAffiliateClick(rec.product.id);
                        trackAffiliateClick(rec.product.id);
                        recordSignal({
                          sessionId,
                          productId: rec.product.id,
                          category,
                          type: "affiliate_click",
                          timestamp: Date.now(),
                          rank: rec.rank,
                        });
                      }}
                      className={`
                        flex items-center justify-center gap-2 w-full font-semibold rounded-xl px-6 py-3.5
                        transition-all duration-150 active:scale-[0.98] text-sm cursor-pointer
                        ${isBest
                          ? "bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/20"
                          : "bg-ink/8 hover:bg-ink/15 text-ink"
                        }
                      `}
                    >
                      Check Current Price
                      <ExternalLinkIcon className="w-4 h-4 shrink-0" />
                    </a>

                  </div>
                </article>
              );
            })}
          </div>

          {/* ── Trending ──────────────────────────────────── */}
          {(() => {
            const trending = results.filter(
              (rec) => intelligence.products[rec.product.id]?.trend === "rising"
            );
            if (trending.length === 0) return null;
            return (
              <div className="animate-fade-in space-y-3 border-t border-ink/10 pt-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
                  Trending with {SEGMENT_LABELS[segment]?.toLowerCase() ?? "similar"} users
                </p>
                <div className="flex flex-wrap gap-2">
                  {trending.map((rec) => (
                    <div
                      key={rec.product.id}
                      className="flex items-center gap-2 bg-paper-soft border border-emerald-700/30 rounded-xl px-3.5 py-2"
                    >
                      <span className="text-[10px] font-bold text-emerald-600" aria-hidden="true">↑</span>
                      <span className="text-xs text-ink">{rec.product.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Footer links ──────────────────────────────── */}
          <div className="animate-fade-in delay-500 border-t border-ink/10 pt-8 space-y-3">
            <Link
              href={`/quiz?category=${category}`}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors duration-150 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retake quiz for {meta.label}
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors duration-150 py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Explore all categories
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <ResultsContent />
    </Suspense>
  );
}
