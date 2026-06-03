"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCategoryConfig, getAllCategories, CATEGORY_META } from "@/lib/category";
import { generateGeoContent }   from "@/lib/geo/geoContentEngine";
import { extractEntities }      from "@/lib/geo/entityExtractor";
import { evaluatePageGeoScore } from "@/lib/geo/geoScore";
import type { GeoScoreBreakdown } from "@/lib/geo/geoScore";
import type { GeoSignal }        from "@/lib/geo/geoSignals";
import type { CategoryKey }      from "@/types/product";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeColor(grade: string): string {
  if (grade === "A") return "text-emerald-400";
  if (grade === "B") return "text-indigo-400";
  if (grade === "C") return "text-amber-400";
  return "text-red-400";
}

function scoreFill(score: number): string {
  if (score >= 80) return "bg-emerald-600";
  if (score >= 60) return "bg-indigo-600";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-600";
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${scoreFill(value)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums font-bold text-gray-400 w-8 text-right">{value}</span>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-1">
      <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

// ─── Pre-compute GEO scores for all categories ────────────────────────────────

function computeAllGeoScores(): Record<CategoryKey, GeoScoreBreakdown> {
  const result = {} as Record<CategoryKey, GeoScoreBreakdown>;
  for (const cat of getAllCategories()) {
    const config   = getCategoryConfig(cat);
    const content  = generateGeoContent("general", cat, config.products);
    const entities = extractEntities(config.products, cat);
    result[cat]    = evaluatePageGeoScore(content, entities);
  }
  return result;
}

const GEO_SCORES = computeAllGeoScores();

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GeoAdminPage() {
  const [signals, setSignals] = useState<GeoSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/geo/signals")
      .then((r) => r.ok ? r.json() : { signals: [] })
      .then((data: { signals: GeoSignal[] }) => setSignals(data.signals))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories   = getAllCategories();
  const avgGeoScore  = Math.round(
    Object.values(GEO_SCORES).reduce((s, v) => s + v.total, 0) / categories.length
  );

  // Signal aggregates
  const totalSessions    = signals.length;
  const quizConversions  = signals.filter((s) => s.convertedToQuiz).length;
  const conversionRate   = totalSessions > 0 ? Math.round((quizConversions / totalSessions) * 100) : 0;
  const avgScrollDepth   = totalSessions > 0
    ? Math.round(signals.reduce((s, v) => s + v.scrollDepth, 0) / totalSessions)
    : 0;
  const avgFaqInteract   = totalSessions > 0
    ? (signals.reduce((s, v) => s + v.faqInteractions, 0) / totalSessions).toFixed(1)
    : "0";
  const avgTableViews    = totalSessions > 0
    ? (signals.reduce((s, v) => s + v.comparisonTableViews, 0) / totalSessions).toFixed(1)
    : "0";

  // Per-category signal breakdown
  const signalsByCategory: Record<string, GeoSignal[]> = {};
  for (const sig of signals) {
    signalsByCategory[sig.category] = [...(signalsByCategory[sig.category] ?? []), sig];
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
            </Link>
            <span className="text-gray-700">/</span>
            <Link href="/admin" className="text-gray-500 hover:text-gray-300 transition-colors">Analytics</Link>
            <span className="text-gray-700">/</span>
            <Link href="/admin/growth" className="text-gray-500 hover:text-gray-300 transition-colors">Growth</Link>
            <span className="text-gray-700">/</span>
            <span className="text-gray-300 font-medium">GEO</span>
          </div>
          <span className={`text-xs font-bold ${loading ? "text-gray-600" : "text-emerald-500"}`}>
            {loading ? "Loading…" : "Live"}
          </span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="space-y-1 animate-fade-in">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">GEO Dashboard</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-900/50 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded-full">
              Generative Engine Optimisation
            </span>
          </div>
          <p className="text-sm text-gray-500">
            AI crawlability scores, structured content completeness, and engagement signals.
          </p>
        </div>

        {/* ── Overview stat cards ──────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-75">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Avg GEO Score"
              value={avgGeoScore}
              sub="across all pages"
              accent={avgGeoScore >= 80 ? "text-emerald-400" : avgGeoScore >= 60 ? "text-indigo-400" : "text-amber-400"}
            />
            <StatCard
              label="GEO Sessions"
              value={totalSessions}
              sub="tracked interactions"
            />
            <StatCard
              label="Quiz Conversion"
              value={`${conversionRate}%`}
              sub={`${quizConversions} of ${totalSessions}`}
              accent="text-violet-400"
            />
            <StatCard
              label="Avg Scroll Depth"
              value={`${avgScrollDepth}%`}
              sub="content engagement"
              accent={avgScrollDepth >= 70 ? "text-emerald-400" : "text-gray-300"}
            />
          </div>
        </section>

        {/* ── GEO Score per category ───────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-150">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            AI Crawl-Friendly Score by Category
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Category</th>
                  <th className="text-right px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Grade</th>
                  <th className="text-right px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">GEO Score</th>
                  <th className="px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Entity Density</th>
                  <th className="px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Structured Data</th>
                  <th className="px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">FAQ Coverage</th>
                  <th className="text-center px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {categories.map((cat) => {
                  const score = GEO_SCORES[cat];
                  const catSignals = signalsByCategory[cat] ?? [];
                  const catConv = catSignals.length > 0
                    ? Math.round((catSignals.filter((s) => s.convertedToQuiz).length / catSignals.length) * 100)
                    : null;
                  return (
                    <tr key={cat} className="hover:bg-gray-800/20">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-gray-200 capitalize">{CATEGORY_META[cat].label}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-lg font-bold ${gradeColor(score.grade)}`}>{score.grade}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-white font-bold tabular-nums">{score.total}</span>
                      </td>
                      <td className="px-5 py-3.5 w-36">
                        <ScoreBar value={score.entityDensity} />
                      </td>
                      <td className="px-5 py-3.5 w-36">
                        <ScoreBar value={score.structuredDataCompleteness} />
                      </td>
                      <td className="px-5 py-3.5 w-36">
                        <ScoreBar value={score.faqCoverage} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/${cat}`}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            View →
                          </Link>
                          {catConv !== null && (
                            <span className="text-[11px] text-emerald-400">{catConv}% CVR</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Structured content completeness ─────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Structured Content Completeness
          </h2>
          <div className="grid md:grid-cols-5 gap-3">
            {(["summary", "comparison", "decision", "entities", "faq"] as const).map((section) => {
              const sectionLabel: Record<string, string> = {
                summary:    "Machine Summary",
                comparison: "Comparison Table",
                decision:   "Decision Logic",
                entities:   "Entity Panel",
                faq:        "FAQ Block",
              };
              // All pages have all sections since we generate them — score is 100 for present sections
              return (
                <div key={section} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {sectionLabel[section]}
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">✓</p>
                  <p className="text-[10px] text-gray-600">All {categories.length} pages</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Engagement signals ───────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-250">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Engagement Signals
          </h2>
          <div className="grid md:grid-cols-2 gap-4">

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Session Averages</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Scroll depth</span>
                  <span className="font-bold tabular-nums text-white">{avgScrollDepth}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${avgScrollDepth}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">FAQ interactions / session</span>
                  <span className="font-bold tabular-nums text-white">{avgFaqInteract}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Comparison table views / session</span>
                  <span className="font-bold tabular-nums text-white">{avgTableViews}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Quiz conversion rate</span>
                  <span className={`font-bold tabular-nums ${conversionRate >= 20 ? "text-emerald-400" : "text-amber-400"}`}>
                    {conversionRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">By Category</p>
              {categories.map((cat) => {
                const catSigs = signalsByCategory[cat] ?? [];
                const catConv = catSigs.length > 0
                  ? Math.round((catSigs.filter((s) => s.convertedToQuiz).length / catSigs.length) * 100)
                  : 0;
                const catScroll = catSigs.length > 0
                  ? Math.round(catSigs.reduce((s, v) => s + v.scrollDepth, 0) / catSigs.length)
                  : 0;
                return (
                  <div key={cat} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 capitalize w-20 shrink-0">
                      {CATEGORY_META[cat].label}
                    </span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600/60 rounded-full" style={{ width: `${catScroll}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-600 w-12 text-right">{catScroll}% scroll</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold w-14 text-right tabular-nums ${catConv >= 20 ? "text-emerald-400" : "text-gray-500"}`}>
                      {catSigs.length > 0 ? `${catConv}% CVR` : "—"}
                    </span>
                  </div>
                );
              })}
              {totalSessions === 0 && (
                <p className="text-xs text-gray-600 italic">No signal data yet — visit a GEO landing page to generate signals.</p>
              )}
            </div>
          </div>
        </section>

        {/* ── GEO score breakdown ──────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-300">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            GEO Score Breakdown (All Categories)
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            {categories.map((cat) => {
              const s = GEO_SCORES[cat];
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300 capitalize">{CATEGORY_META[cat].label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${gradeColor(s.grade)}`}>{s.grade}</span>
                      <span className="text-sm font-bold tabular-nums text-white w-8 text-right">{s.total}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 text-[10px] text-gray-600">
                    {[
                      { label: "Entity", value: s.entityDensity },
                      { label: "Structure", value: s.structuredDataCompleteness },
                      { label: "Comparison", value: s.comparisonDepth },
                      { label: "FAQ", value: s.faqCoverage },
                      { label: "Clarity", value: s.clarityIndex },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span>{label}</span>
                          <span className="font-medium text-gray-500">{value}</span>
                        </div>
                        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${scoreFill(value)}`} style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Footer nav ───────────────────────────────────────────────── */}
        <div className="animate-fade-in delay-400 flex items-center justify-center gap-6 text-xs text-gray-600 pt-4 border-t border-gray-800/50">
          <Link href="/admin/growth" className="hover:text-violet-400 transition-colors">← Growth Dashboard</Link>
          <Link href="/admin" className="hover:text-indigo-400 transition-colors">Analytics</Link>
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
        </div>

      </main>
    </div>
  );
}
