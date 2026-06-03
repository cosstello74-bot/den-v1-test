"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ExpansionOpportunity } from "@/lib/ael/expansionEngine";
import type { GeneratedPageConfig }  from "@/lib/ael/pageGenerator";
import type { GeneratedCategory }    from "@/lib/ael/categoryGenerator";
import type { RevenueScanResult }    from "@/lib/ael/revenueScanner";
import type { FeedbackRecord }       from "@/lib/ael/feedbackLoop";

// ─── AEL state shape (matching expansion-state.json) ─────────────────────────

type AELState = {
  lastRun:                 string;
  totalPagesGenerated:     number;
  totalCategoriesGenerated: number;
  expansionHistory:        Array<{ runId: string; timestamp: string; pagesAdded: number; categoriesAdded: number; opportunitiesDetected: number; confidenceThreshold: number }>;
  currentOpportunities:    ExpansionOpportunity[];
  revenueScans:            RevenueScanResult[];
  feedbackState: {
    confidenceThreshold: number;
    expansionRecords:    FeedbackRecord[];
    avgExpansionScore:   number;
    lastEvaluated:       string;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function impactColor(impact: string): string {
  if (impact === "high")   return "text-emerald-400 bg-emerald-950/40 border-emerald-800/40";
  if (impact === "medium") return "text-amber-400 bg-amber-950/40 border-amber-800/40";
  return "text-gray-500 bg-gray-800/60 border-gray-700";
}

function priorityColor(p: string): string {
  if (p === "urgent") return "text-red-400";
  if (p === "medium") return "text-amber-400";
  return "text-gray-500";
}

function typeIcon(type: string): string {
  if (type === "new_intent_page")  return "↗";
  if (type === "new_category")     return "⊕";
  if (type === "revenue_fix")      return "£";
  if (type === "geo_coverage_gap") return "◉";
  return "·";
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-1">
      <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, color = "bg-indigo-600" }: { value: number; color?: string }) {
  return (
    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AELAdminPage() {
  const [state, setState]     = useState<AELState | null>(null);
  const [pages, setPages]     = useState<GeneratedPageConfig[]>([]);
  const [cats, setCats]       = useState<GeneratedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [stateRes, pagesRes, catsRes] = await Promise.all([
          fetch("/api/ael/state"),
          fetch("/api/ael/pages"),
          fetch("/api/ael/categories"),
        ]);
        if (stateRes.ok) setState(await stateRes.json() as AELState);
        if (pagesRes.ok) setPages((await pagesRes.json() as { pages: GeneratedPageConfig[] }).pages);
        if (catsRes.ok)  setCats((await catsRes.json() as { categories: GeneratedCategory[] }).categories);
      } catch { /* fall through */ }
      finally { setLoading(false); }
    };
    void loadAll();
  }, []);

  const lastRun = state ? new Date(state.lastRun).toLocaleString("en-GB") : "—";
  const totalOpps = state?.currentOpportunities.length ?? 0;
  const highOpps  = state?.currentOpportunities.filter((o) => o.estimatedImpact === "high").length ?? 0;
  const threshold = state?.feedbackState.confidenceThreshold ?? 0.85;
  const avgScore  = state?.feedbackState.avgExpansionScore ?? 0;

  const urgentScans = state?.revenueScans.filter((r) => r.priority === "urgent").length ?? 0;

  // Group opportunities by type
  const oppByType: Record<string, ExpansionOpportunity[]> = {};
  for (const opp of state?.currentOpportunities ?? []) {
    oppByType[opp.type] = [...(oppByType[opp.type] ?? []), opp];
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
            <span className="text-gray-300 font-medium">AEL</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {loading
              ? <span className="text-gray-600">Loading…</span>
              : <span className="text-emerald-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Live
                </span>
            }
            <span className="text-gray-600 font-mono text-[10px]">Last run: {lastRun}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="space-y-1 animate-fade-in">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Autonomous Expansion Layer</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-900/50 text-violet-400 border border-violet-800/50 px-2 py-0.5 rounded-full">
              Build-time System
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Deterministic rule-based expansion engine. Generates pages, categories, and intent coverage autonomously.
          </p>
          <p className="text-[11px] text-gray-600 font-mono">
            Run: <span className="text-gray-400">npm run ael:build</span>
          </p>
        </div>

        {/* ── Stat overview ────────────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-75">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Pages Generated"
              value={state?.totalPagesGenerated ?? pages.length}
              sub={`${highOpps} high-impact opportunities`}
              accent="text-indigo-400"
            />
            <StatCard
              label="Categories"
              value={state?.totalCategoriesGenerated ?? cats.length}
              sub="product clusters detected"
              accent="text-violet-400"
            />
            <StatCard
              label="Confidence Threshold"
              value={`${(threshold * 100).toFixed(0)}%`}
              sub="auto-adjusts via feedback"
              accent={threshold <= 0.87 ? "text-emerald-400" : "text-amber-400"}
            />
            <StatCard
              label="Avg Expansion Score"
              value={avgScore > 0 ? `${avgScore}/100` : "—"}
              sub={avgScore > 0 ? "feedback loop" : "awaiting signal data"}
              accent={avgScore >= 70 ? "text-emerald-400" : avgScore >= 40 ? "text-amber-400" : "text-gray-500"}
            />
          </div>
        </section>

        {/* ── Generated pages ──────────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-150">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Generated Pages</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {pages.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-600 text-center italic">
                No pages generated yet. Run <code className="text-gray-400">npm run ael:build</code> to generate.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Slug</th>
                    <th className="text-left px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Intent</th>
                    <th className="text-left px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Category</th>
                    <th className="text-right px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Confidence</th>
                    <th className="text-center px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {pages.map((p) => (
                    <tr key={p.slug} className="hover:bg-gray-800/20">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-gray-400">{p.slug}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{p.intent.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3.5 capitalize text-gray-400 text-xs">{p.category}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-xs font-bold tabular-nums ${p.confidence >= 0.90 ? "text-emerald-400" : p.confidence >= 0.87 ? "text-indigo-400" : "text-amber-400"}`}>
                          {(p.confidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link
                          href={`/generated/${p.slug}`}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── Generated categories ─────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Generated Categories</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {cats.length === 0
              ? <p className="col-span-3 text-sm text-gray-600 italic">No categories generated.</p>
              : cats.map((cat) => (
                  <div key={cat.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-200">{cat.name}</p>
                      <span className="text-[10px] font-bold text-indigo-400">{(cat.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{cat.description}</p>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {cat.productIds.map((pid) => (
                        <span key={pid} className="font-mono text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">{pid}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-700 font-mono">{cat.source}</p>
                  </div>
                ))}
          </div>
        </section>

        {/* ── Expansion opportunities ──────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-250">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Expansion Opportunities ({totalOpps})
          </h2>
          <div className="space-y-2">
            {(state?.currentOpportunities ?? []).slice(0, 10).map((opp) => (
              <div key={opp.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-4">
                <span className="text-lg font-bold text-gray-600 shrink-0 w-6 text-center">
                  {typeIcon(opp.type)}
                </span>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-gray-300">{opp.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${impactColor(opp.estimatedImpact)}`}>
                      {opp.estimatedImpact}
                    </span>
                    <span className="text-[10px] text-gray-600 capitalize">{opp.type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{opp.rationale}</p>
                </div>
                <div className="shrink-0 text-right space-y-0.5">
                  <p className="text-sm font-bold tabular-nums text-white">{(opp.confidence * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-gray-600">confidence</p>
                </div>
              </div>
            ))}
            {(state?.currentOpportunities ?? []).length > 10 && (
              <p className="text-xs text-gray-600 text-center pt-1">
                +{(state?.currentOpportunities.length ?? 0) - 10} more opportunities
              </p>
            )}
          </div>
        </section>

        {/* ── Revenue scan ─────────────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-300">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Revenue Scan {urgentScans > 0 && <span className="text-red-400 ml-1">· {urgentScans} urgent</span>}
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800/60">
            {(state?.revenueScans ?? []).length === 0
              ? <p className="px-5 py-6 text-sm text-gray-600 italic">No revenue issues detected.</p>
              : (state?.revenueScans ?? []).map((scan) => (
                  <div key={scan.productId} className="px-5 py-4 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{scan.productId}</span>
                      <span className={`text-xs font-bold ${priorityColor(scan.priority)}`}>{scan.priority}</span>
                      <span className="text-[11px] text-gray-600">{scan.issue.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{scan.suggestion}</p>
                    <div className="flex items-center gap-4 text-[10px] text-gray-700">
                      {scan.currentMetrics.affiliatePayout !== undefined && (
                        <span>Payout: £{scan.currentMetrics.affiliatePayout as number}</span>
                      )}
                      {scan.currentMetrics.conversionRate !== undefined && (
                        <span>Conv: {((scan.currentMetrics.conversionRate as number) * 100).toFixed(1)}%</span>
                      )}
                      {scan.currentMetrics.revenueTrend && (
                        <span className={scan.currentMetrics.revenueTrend === "rising" ? "text-emerald-700" : scan.currentMetrics.revenueTrend === "declining" ? "text-red-700" : ""}>
                          {scan.currentMetrics.revenueTrend as string}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </section>

        {/* ── Feedback + expansion history ─────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-300">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Expansion History</h2>
          <div className="grid md:grid-cols-2 gap-4">

            {/* Feedback state */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Feedback Loop</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Confidence threshold</span>
                  <span className="font-bold tabular-nums text-white">{(threshold * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Avg expansion score</span>
                  <span className={`font-bold tabular-nums ${avgScore >= 70 ? "text-emerald-400" : avgScore >= 40 ? "text-amber-400" : "text-gray-500"}`}>
                    {avgScore > 0 ? avgScore : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Records evaluated</span>
                  <span className="font-bold tabular-nums text-gray-300">
                    {state?.feedbackState.expansionRecords.length ?? 0}
                  </span>
                </div>
                {state && (
                  <div className="flex items-center gap-2 pt-1">
                    <MiniBar
                      value={avgScore}
                      color={avgScore >= 70 ? "bg-emerald-600" : avgScore >= 40 ? "bg-amber-500" : "bg-gray-700"}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Run history */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Run History</p>
              {(state?.expansionHistory ?? []).length === 0
                ? <p className="text-xs text-gray-600 italic">No runs recorded.</p>
                : [...(state?.expansionHistory ?? [])].reverse().slice(0, 5).map((run) => (
                    <div key={run.runId} className="flex items-center justify-between text-xs border-b border-gray-800 pb-2 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <p className="font-mono text-[10px] text-gray-600">{new Date(run.timestamp).toLocaleString("en-GB")}</p>
                        <p className="text-gray-400">+{run.pagesAdded} pages · +{run.categoriesAdded} cats</p>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-bold">{(run.confidenceThreshold * 100).toFixed(0)}% thresh</span>
                    </div>
                  ))}
            </div>
          </div>
        </section>

        {/* ── Footer nav ───────────────────────────────────────────────── */}
        <div className="animate-fade-in delay-400 flex items-center justify-center gap-6 text-xs text-gray-600 pt-4 border-t border-gray-800/50">
          <Link href="/admin/growth/geo" className="hover:text-indigo-400 transition-colors">← GEO Dashboard</Link>
          <Link href="/admin/growth" className="hover:text-violet-400 transition-colors">Growth</Link>
          <Link href="/admin" className="hover:text-gray-400 transition-colors">Analytics</Link>
        </div>

      </main>
    </div>
  );
}
