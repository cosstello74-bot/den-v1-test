"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getStoredEvents, clearStoredEvents } from "@/lib/eventLogger";
import { getAllCategories, getCategoryConfig, CATEGORY_META } from "@/lib/category";
import { ctrToMultiplier, truthScoreToMultiplier } from "@/lib/globalMultiplier";
import { getConfidenceWeight } from "@/lib/confidence";
import type { Event, EventType, SegmentType } from "@/types/event";
import type { IntelligenceModel, ProductIntelligence } from "@/lib/learningEngine";
import type { TruthModel, ProductTruth } from "@/lib/truthModel";
import type { CategoryKey } from "@/types/product";
import seedIntelligence from "@/data/intelligenceModel.json";
import seedTruth        from "@/data/truthModel.json";

// v6 — Autonomous Business Operator
import type { Opportunity }        from "@/lib/v6/opportunityDetector";
import type { Strategy }           from "@/lib/v6/strategyEngine";
import type { DecisionLogEntry }   from "@/lib/v6/autonomousLoop";
import type { PerformanceStore }   from "@/lib/v5/performanceTracker";
import { detectOpportunities, summariseOpportunities } from "@/lib/v6/opportunityDetector";
import { generateStrategies, deduplicateStrategies }   from "@/lib/v6/strategyEngine";
import { loadPerformanceStore }    from "@/lib/v5/performanceTracker";
import { loadDecisionLog }         from "@/lib/v6/autonomousLoop";
import { loadMemory }              from "@/lib/v6/businessMemory";
import { loadRevenueControlState } from "@/lib/v6/revenueControl";

// v7 — Ecosystem Network
import type { EcosystemState }   from "@/lib/v7/ecosystemOrchestrator";
import type { DeploymentSnapshot } from "@/lib/v7/deploymentSimulator";
import { getEcosystemSnapshot, runEvolutionTick } from "@/lib/v7/evolutionEngine";
import { rankNodes }             from "@/lib/v7/ecosystemOrchestrator";
import { getTopIntents, getTopRevenueCategories } from "@/lib/v7/intelligenceNetwork";

// v8 — Economic Physics
import type { EconomicTickResult }  from "@/lib/v8/core/recursiveLoop";
import { getEconomicSnapshot, runEconomicTick } from "@/lib/v8/core/recursiveLoop";

// ─── Utilities ───────────────────────────────────────────────────────────────

function pct(n: number, d: number) { return d === 0 ? 0 : Math.round((n / d) * 100); }
function countType(events: Event[], type: EventType) {
  return events.filter((e) => e.type === type).length;
}
function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function StatCard({
  label, value, sub, delta, colour = "default",
}: {
  label: string; value: string | number; sub?: string; delta?: string;
  colour?: "default" | "indigo" | "green" | "red" | "amber";
}) {
  const border = {
    default: "border-gray-800 bg-gray-900",
    indigo:  "border-indigo-800/50 bg-indigo-950/30",
    green:   "border-emerald-800/50 bg-emerald-950/20",
    red:     "border-red-800/50 bg-red-950/20",
    amber:   "border-amber-800/50 bg-amber-950/20",
  }[colour];
  const text = {
    default: "text-white",
    indigo:  "text-indigo-400",
    green:   "text-emerald-400",
    red:     "text-red-400",
    amber:   "text-amber-400",
  }[colour];
  return (
    <div className={`rounded-2xl border p-5 space-y-2 ${border}`}>
      <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-2xl font-bold tabular-nums truncate ${text}`}>{value}</p>
      <div className="flex items-center gap-2">
        {sub && <p className="text-xs text-gray-600">{sub}</p>}
        {delta && <span className="text-xs font-semibold text-emerald-400">{delta}</span>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 pb-2.5">
      {children}
    </h2>
  );
}

function MiniBar({ value, max, colour = "bg-indigo-500" }: { value: number; max: number; colour?: string }) {
  const w = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden shrink-0">
        <div className={`h-full ${colour} rounded-full`} style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-400 tabular-nums">{value.toFixed(1)}%</span>
    </div>
  );
}

function FunnelRow({
  label, count, base, colour,
}: { label: string; count: number; base: number; colour: string }) {
  const rate = base > 0 ? Math.round((count / base) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-400 w-44 shrink-0 text-right hidden sm:block">{label}</span>
      <span className="text-sm text-gray-400 sm:hidden shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-lg h-8 overflow-hidden relative min-w-0">
        <div
          className={`h-full ${colour} rounded-lg transition-all duration-700`}
          style={{ width: `${rate}%` }}
        />
        <div className="absolute inset-0 flex items-center px-3 gap-2">
          <span className="text-xs font-bold text-white tabular-nums">{fmt(count)}</span>
        </div>
      </div>
      <span className="text-sm font-mono text-gray-500 w-12 text-right shrink-0 tabular-nums">{rate}%</span>
    </div>
  );
}

function Chip({ type }: { type: string }) {
  const colours: Record<string, string> = {
    affiliate_clicked:    "bg-emerald-900/40 text-emerald-400",
    product_clicked:      "bg-emerald-900/20 text-emerald-500",
    quiz_completed:       "bg-indigo-900/40 text-indigo-400",
    product_viewed:       "bg-yellow-900/30 text-yellow-500",
    results_viewed:       "bg-blue-900/30 text-blue-400",
    quiz_started:         "bg-gray-800 text-gray-400",
    question_answered:    "bg-gray-800 text-gray-500",
    conversion_confirmed: "bg-emerald-900/60 text-emerald-300",
    conversion_failed:    "bg-red-900/30 text-red-400",
    product_returned:     "bg-red-900/50 text-red-300",
    product_revisited:    "bg-violet-900/40 text-violet-400",
  };
  return (
    <span className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-full ${colours[type] ?? "bg-gray-800 text-gray-400"}`}>
      {type}
    </span>
  );
}

// ─── Tab configuration ────────────────────────────────────────────────────────

type Tab = "overview" | "intelligence" | "behavior" | "truth" | "health" | "v6" | "v7" | "v8";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",     label: "Overview",     icon: "📊" },
  { id: "intelligence", label: "Intelligence", icon: "🧠" },
  { id: "behavior",     label: "Behavior",     icon: "📈" },
  { id: "truth",        label: "Truth",        icon: "🔍" },
  { id: "health",       label: "Health",       icon: "❤️" },
  { id: "v6",           label: "Operator",     icon: "⚡" },
  { id: "v7",           label: "Ecosystem",    icon: "🌐" },
  { id: "v8",           label: "Economy",      icon: "⚛️" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab]               = useState<Tab>("overview");
  const [intelligence, setIntelligence] = useState<IntelligenceModel>(seedIntelligence as IntelligenceModel);
  const [truthModel, setTruthModel] = useState<TruthModel>(seedTruth as TruthModel);
  const [localEvents, setLocalEvents]   = useState<Event[]>([]);
  const [filterType, setFilterType]     = useState<string>("all");
  const [tick, setTick]                 = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const fetchedRef                      = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/events/batch").then((r) => r.json()).catch(() => null),
      fetch("/api/truthModel").then((r) => r.json()).catch(() => null),
    ]).then(([intel, truth]) => {
      if (intel)  setIntelligence(intel as IntelligenceModel);
      if (truth)  setTruthModel(truth as TruthModel);
      setLastRefreshed(new Date());
    });
  }, [tick]);

  useEffect(() => {
    setLocalEvents(getStoredEvents());
  }, [tick]);

  useEffect(() => { fetchedRef.current = true; }, []);

  // ── v6 state ─────────────────────────────────────────────────────────────
  const [v6Opportunities, setV6Opportunities] = useState<Opportunity[]>([]);
  const [v6Strategies,    setV6Strategies]    = useState<Strategy[]>([]);
  const [v6DecisionLog,   setV6DecisionLog]   = useState<DecisionLogEntry[]>([]);
  const [v6PerfStore,     setV6PerfStore]     = useState<PerformanceStore | null>(null);

  useEffect(() => {
    const perf    = loadPerformanceStore();
    const memory  = loadMemory();
    const control = loadRevenueControlState();
    void control;

    // Build intent signals from memory behaviour clusters
    const intentSignals = memory.behaviourClusters.map((c) => ({
      key:        `${c.purposeKey}-${c.budgetKey}`,
      slug:       `${c.purposeKey}-${c.budgetKey}-laptops`,
      frequency:  c.frequency,
      confidence: Math.min(0.95, 0.60 + c.frequency * 0.02),
      hasPage:    false,
    }));

    // Build traffic signals from v5 perf store
    const trafficSignals = (["A","B","C","D"] as const).map((id) => ({
      slug:            `variant-${id}`,
      pageViews:       perf[id].pageViews,
      affiliateClicks: perf[id].affiliateClicks,
      conversionRate:  perf[id].pageViews > 0 ? perf[id].affiliateClicks / perf[id].pageViews : 0,
    }));

    const opps = detectOpportunities({ trafficSignals, intentSignals, performanceStore: perf, urgencyFloor: 0.3 });
    const strats = deduplicateStrategies(generateStrategies(opps));

    setV6Opportunities(opps);
    setV6Strategies(strats);
    setV6PerfStore(perf);
    setV6DecisionLog(loadDecisionLog());
  }, [tick]);

  // ── v7 state ─────────────────────────────────────────────────────────────
  const [v7EcoState,   setV7EcoState]   = useState<EcosystemState | null>(null);
  const [v7Snapshot,   setV7Snapshot]   = useState<DeploymentSnapshot | null>(null);
  const [v7TopIntents, setV7TopIntents] = useState<ReturnType<typeof getTopIntents>>([]);
  const [v7TopCats,    setV7TopCats]    = useState<ReturnType<typeof getTopRevenueCategories>>([]);

  useEffect(() => {
    const { state, snapshot } = getEcosystemSnapshot();
    setV7EcoState(state);
    setV7Snapshot(snapshot);
    setV7TopIntents(getTopIntents(8));
    setV7TopCats(getTopRevenueCategories(5));
  }, [tick]);

  function handleRunEvolution() {
    runEvolutionTick(v6Opportunities, []);
    setTick((t) => t + 1);
  }

  // ── v8 state ─────────────────────────────────────────────────────────────
  const [v8Snapshot, setV8Snapshot] = useState<EconomicTickResult | null>(null);

  useEffect(() => {
    setV8Snapshot(getEconomicSnapshot() as EconomicTickResult);
  }, [tick]);

  function handleRunEconomicTick() {
    const result = runEconomicTick();
    setV8Snapshot(result);
    setTick((t) => t + 1);
  }

  const categories = getAllCategories();

  // Product name map
  const productNameMap: Record<string, string> = {};
  categories.forEach((cat) =>
    getCategoryConfig(cat).products.forEach((p) => { productNameMap[p.id] = p.name; })
  );

  // Intelligence entries sorted by weighted CTR
  const productEntries = Object.entries(intelligence.products as Record<string, ProductIntelligence>)
    .map(([id, intel]) => ({ id, ...intel }))
    .sort((a, b) => b.weighted_ctr - a.weighted_ctr);

  const maxCtr = productEntries[0]?.weighted_ctr ?? 1;

  // Truth entries sorted by truth score
  const truthEntries = Object.entries(truthModel.products as Record<string, ProductTruth>)
    .map(([id, truth]) => ({ id, ...truth }))
    .sort((a, b) => b.truth_score - a.truth_score);

  const rising   = productEntries.filter((p) => p.trend === "rising");
  const declining = productEntries.filter((p) => p.trend === "declining");

  // ─── Funnel stats (local events) ─────────────────────────────────────────
  const started   = countType(localEvents, "quiz_started");
  const completed = countType(localEvents, "quiz_completed");
  const viewed    = countType(localEvents, "results_viewed");
  const clicked   = countType(localEvents, "affiliate_clicked");
  const confirmed = countType(localEvents, "conversion_confirmed");

  // Category breakdown
  const catCounts: Record<string, number> = {};
  for (const e of localEvents) { catCounts[e.category] = (catCounts[e.category] ?? 0) + 1; }
  const maxCatCount = Math.max(...Object.values(catCounts), 1);

  // Segment breakdown
  const SEGS: SegmentType[] = ["student", "gamer", "professional", "creator", "general"];
  const segClicks: Record<SegmentType, number> = {} as Record<SegmentType, number>;
  const segViews:  Record<SegmentType, number> = {} as Record<SegmentType, number>;
  for (const e of localEvents) {
    const seg = e.metadata?.segment as SegmentType | undefined;
    if (!seg) continue;
    if (e.type === "results_viewed")    segViews[seg]  = (segViews[seg]  ?? 0) + 1;
    if (e.type === "affiliate_clicked") segClicks[seg] = (segClicks[seg] ?? 0) + 1;
  }

  // ─── Truth tab data ───────────────────────────────────────────────────────
  const falsePositives = truthEntries.filter((t) => {
    const intel = (intelligence.products as Record<string, ProductIntelligence>)[t.id];
    return intel && intel.weighted_ctr >= 8 && t.truth_score < 0.5;
  });

  const biasHeavy = truthEntries.filter((t) => {
    const intel = (intelligence.products as Record<string, ProductIntelligence>)[t.id];
    if (!intel) return false;
    return Math.abs(intel.weighted_ctr - t.bias_corrected_ctr) >= 2.5;
  });

  // ─── Health tab data ──────────────────────────────────────────────────────
  const confidenceTiers = { high: 0, mid: 0, low: 0 };
  for (const t of truthEntries) {
    if (t.confidence >= 1.0)      confidenceTiers.high++;
    else if (t.confidence >= 0.8) confidenceTiers.mid++;
    else                          confidenceTiers.low++;
  }

  const outcomeTypes: EventType[] = ["conversion_confirmed", "conversion_failed", "product_returned", "product_revisited"];
  const interactionTypes: EventType[] = ["product_viewed", "product_clicked", "affiliate_clicked"];
  const outcomeCount     = localEvents.filter((e) => outcomeTypes.includes(e.type as EventType)).length;
  const interactionCount = localEvents.filter((e) => interactionTypes.includes(e.type as EventType)).length;
  const stnRaw = interactionCount > 0 ? (outcomeCount / interactionCount * 100) : null;

  const allEventTypes: EventType[] = [
    "quiz_started", "quiz_completed", "results_viewed", "product_viewed",
    "product_clicked", "affiliate_clicked", "question_answered",
    "conversion_confirmed", "conversion_failed", "product_returned", "product_revisited",
  ];
  const filteredStream = filterType === "all"
    ? localEvents
    : localEvents.filter((e) => e.type === filterType);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 mr-2">
            <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
          </Link>
          <div>
            <p className="text-xs font-bold text-white leading-none">Analytics Cockpit</p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {lastRefreshed ? `Refreshed ${lastRefreshed.toLocaleTimeString()}` : "Loading…"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setTick((v) => v + 1)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-400 border border-gray-800 hover:border-indigo-700/50 bg-gray-900 hover:bg-indigo-950/30 px-3 py-1.5 rounded-lg transition-all duration-150"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </nav>

      <div className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full space-y-8">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="space-y-1 animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Truth-calibrated intelligence — outcome-verified, bias-corrected, segment-aware.
          </p>
        </div>

        {/* ── Top stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
          <StatCard label="Total Events"       value={fmt(localEvents.length)} sub="local session" />
          <StatCard label="Quiz Completions"   value={completed}              sub={`of ${started} starts`} colour="indigo" />
          <StatCard label="Affiliate Clicks"   value={clicked}                sub={`${pct(clicked, viewed)}% CTR`} colour="green" />
          <StatCard label="Products Tracked"   value={productEntries.length}  sub="in intelligence model" colour="indigo" />
        </div>

        {/* ── Tab nav ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-gray-800 overflow-x-auto animate-fade-in delay-150">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-all duration-150 ${
                tab === id
                  ? "bg-gray-900 border border-b-0 border-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div className="space-y-10 animate-fade-in">

            <section className="space-y-5">
              <SectionTitle>Funnel Summary</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Quiz Starts"     value={started}   />
                <StatCard label="Completions"     value={completed} colour="indigo" />
                <StatCard label="Results Views"   value={viewed}    colour="indigo" />
                <StatCard label="Conversions"     value={confirmed} colour="green"  />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Completion Rate"
                  value={`${pct(completed, started)}%`}
                  sub="quiz starts → completions"
                  colour={pct(completed, started) >= 70 ? "green" : "default"}
                />
                <StatCard
                  label="Results CTR"
                  value={`${pct(clicked, viewed)}%`}
                  sub="results views → affiliate clicks"
                  colour={pct(clicked, viewed) >= 15 ? "green" : "default"}
                />
                <StatCard
                  label="Trend Signals"
                  value={`${rising.length} rising`}
                  sub={`${declining.length} declining`}
                  colour={rising.length > 0 ? "green" : "default"}
                />
              </div>
            </section>

            <section className="space-y-5">
              <SectionTitle>Category Activity (Local Session)</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Category</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Events</th>
                      <th className="px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden sm:table-cell">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => {
                      const count = catCounts[cat] ?? 0;
                      return (
                        <tr key={cat} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-200">{CATEGORY_META[cat as CategoryKey].label}</span>
                              {(cat === "laptops" || cat === "phones") && (
                                <span className="text-[9px] font-bold tracking-wide text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded-full uppercase">Live</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-400 tabular-nums font-mono">{count}</td>
                          <td className="px-5 py-3 hidden sm:table-cell">
                            <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500/70 rounded-full"
                                style={{ width: maxCatCount > 0 ? `${(count / maxCatCount) * 100}%` : "0%" }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-5">
              <SectionTitle>Trend Signals</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/15 p-5 space-y-3">
                  <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Rising</p>
                  {rising.length === 0
                    ? <p className="text-gray-600 text-sm">No rising signals yet.</p>
                    : rising.map((p) => (
                      <div key={p.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-200">{productNameMap[p.id] ?? p.id}</span>
                        <span className="text-emerald-400 font-mono text-xs font-bold">{p.weighted_ctr.toFixed(1)}%</span>
                      </div>
                    ))
                  }
                </div>
                <div className="rounded-2xl border border-red-800/40 bg-red-950/10 p-5 space-y-3">
                  <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest">Declining</p>
                  {declining.length === 0
                    ? <p className="text-gray-600 text-sm">No declining signals.</p>
                    : declining.map((p) => (
                      <div key={p.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-200">{productNameMap[p.id] ?? p.id}</span>
                        <span className="text-red-400 font-mono text-xs font-bold">{p.weighted_ctr.toFixed(1)}%</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── INTELLIGENCE ─────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "intelligence" && (
          <div className="space-y-10 animate-fade-in">
            <section className="space-y-5">
              <SectionTitle>Product Intelligence — CTR × Truth Matrix</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Product</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Raw CTR</th>
                      <th className="px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Weighted CTR</th>
                      <th className="px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Truth Score</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Multiplier</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productEntries.map((p) => {
                      const mult  = ctrToMultiplier(p.weighted_ctr);
                      const truth = (truthModel.products as Record<string, ProductTruth>)[p.id];
                      const truthMult = truth ? truthScoreToMultiplier(truth.truth_score) : 1.0;
                      const trendCol  = p.trend === "rising" ? "text-emerald-400" : p.trend === "declining" ? "text-red-400" : "text-gray-600";
                      // Mismatch: high CTR but low truth
                      const mismatch  = p.weighted_ctr >= 8 && truth && truth.truth_score < 0.5;
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors ${mismatch ? "bg-red-950/5" : ""}`}
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-200">{productNameMap[p.id] ?? p.id}</span>
                              {mismatch && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/50 border border-amber-800/40 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                  ⚠ Mismatch
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-xs text-gray-500 tabular-nums">
                            {p.global_ctr.toFixed(1)}%
                          </td>
                          <td className="px-5 py-3">
                            <MiniBar value={p.weighted_ctr} max={maxCtr + 2} colour="bg-indigo-500" />
                          </td>
                          <td className="px-5 py-3">
                            {truth
                              ? <MiniBar
                                  value={truth.truth_score * 20}
                                  max={20}
                                  colour={truth.truth_score >= 0.7 ? "bg-emerald-500" : truth.truth_score >= 0.5 ? "bg-indigo-500" : "bg-amber-500"}
                                />
                              : <span className="text-xs text-gray-700">—</span>
                            }
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className={`font-mono text-xs font-bold ${mult >= 1.15 ? "text-emerald-400" : mult <= 0.85 ? "text-red-400" : "text-gray-500"}`}>
                                {mult.toFixed(2)}×
                              </span>
                              {truth && (
                                <span className={`font-mono text-xs text-gray-600`}>
                                  / {truthMult.toFixed(2)}×
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`px-5 py-3 text-right text-xs font-bold ${trendCol}`}>
                            {p.trend}
                          </td>
                        </tr>
                      );
                    })}
                    {productEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-gray-600 text-sm">
                          No intelligence data yet. Complete the quiz to generate signals.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600">
                Multiplier format: <span className="font-mono text-gray-500">CTR mult × Truth mult</span>.
                Mismatch flag = high CTR but low truth score — potential false signal.
              </p>
            </section>

            <section className="space-y-5">
              <SectionTitle>Segment Conversion Rates (Local Session)</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Segment</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Views</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Clicks</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SEGS.map((seg) => {
                      const v = segViews[seg] ?? 0;
                      const c = segClicks[seg] ?? 0;
                      const rate = pct(c, v);
                      return (
                        <tr key={seg} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-gray-200 capitalize">{seg}</td>
                          <td className="px-5 py-3 text-right text-gray-400 tabular-nums">{v}</td>
                          <td className="px-5 py-3 text-right text-gray-400 tabular-nums">{c}</td>
                          <td className={`px-5 py-3 text-right font-mono font-bold tabular-nums ${rate >= 10 ? "text-emerald-400" : v > 0 ? "text-indigo-400" : "text-gray-700"}`}>
                            {v > 0 ? `${rate}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── BEHAVIOR ─────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "behavior" && (
          <div className="space-y-10 animate-fade-in">

            <section className="space-y-5">
              <SectionTitle>Conversion Funnel</SectionTitle>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <FunnelRow label="Quiz Starts"      count={started}   base={started}   colour="bg-indigo-600/50" />
                <FunnelRow label="Quiz Complete"    count={completed} base={started}   colour="bg-indigo-600/60" />
                <FunnelRow label="Results Viewed"   count={viewed}    base={started}   colour="bg-indigo-600/70" />
                <FunnelRow label="Affiliate Clicks" count={clicked}   base={started}   colour="bg-indigo-600/80" />
                <FunnelRow label="Conversions"      count={confirmed} base={started}   colour="bg-emerald-600/70" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Completion Rate"
                  value={`${pct(completed, started)}%`}
                  sub="starts → completions"
                  colour={pct(completed, started) >= 70 ? "green" : "default"}
                />
                <StatCard
                  label="Results CTR"
                  value={`${pct(clicked, viewed)}%`}
                  sub="views → affiliate clicks"
                  colour={pct(clicked, viewed) >= 15 ? "green" : "default"}
                />
                <StatCard
                  label="Drop-off (Q→R)"
                  value={`${100 - pct(viewed, completed)}%`}
                  sub="quiz → results drop"
                  colour={(100 - pct(viewed, completed)) > 40 ? "red" : "default"}
                />
              </div>
            </section>

            <section className="space-y-5">
              <SectionTitle>Event Stream</SectionTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-600 mr-1">Filter:</span>
                {(["all", ...allEventTypes] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors font-mono ${
                      filterType === t
                        ? "border-indigo-500 text-indigo-400 bg-indigo-950/40"
                        : "border-gray-800 text-gray-600 hover:border-gray-600 hover:text-gray-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-700 tabular-nums">
                  {filteredStream.length} events
                </span>
              </div>

              {filteredStream.length === 0 ? (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-600 text-sm">
                  No events yet. Complete the quiz to generate events.
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-800 overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/60">
                        <th className="text-left px-4 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Category</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Product</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Segment</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredStream].reverse().slice(0, 100).map((e, i) => (
                        <tr key={i} className="border-b border-gray-800/30 last:border-0 hover:bg-gray-900/50 transition-colors">
                          <td className="px-4 py-2.5"><Chip type={e.type} /></td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs">{e.category}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">
                            {e.productId ? (productNameMap[e.productId] ?? e.productId) : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 text-xs capitalize">
                            {(e.metadata?.segment as string) ?? "—"}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700 font-mono text-xs">
                            {new Date(e.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => { clearStoredEvents(); setTick((v) => v + 1); }}
                  className="text-xs text-red-500 hover:text-red-400 border border-red-900/50 hover:border-red-600/50 bg-red-950/20 hover:bg-red-950/40 px-3 py-1.5 rounded-lg transition-all duration-150"
                >
                  Clear Local Events
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── TRUTH PANEL ──────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "truth" && (
          <div className="space-y-10 animate-fade-in">

            <section className="space-y-5">
              <SectionTitle>Top Products by Truth Score</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Product</th>
                      <th className="px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Truth Score</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Truth Mult</th>
                      <th className="px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Bias-Corr CTR</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Confidence</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Interactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {truthEntries.map((t) => {
                      const conf = getConfidenceWeight(t.interaction_count);
                      const mult = truthScoreToMultiplier(t.truth_score);
                      return (
                        <tr key={t.id} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-gray-200">{productNameMap[t.id] ?? t.id}</td>
                          <td className="px-5 py-3">
                            <MiniBar
                              value={t.truth_score * 100}
                              max={100}
                              colour={t.truth_score >= 0.7 ? "bg-emerald-500" : t.truth_score >= 0.5 ? "bg-indigo-500" : "bg-amber-500"}
                            />
                          </td>
                          <td className={`px-5 py-3 text-right font-mono font-bold text-xs ${mult >= 1.15 ? "text-emerald-400" : mult <= 0.85 ? "text-red-400" : "text-gray-500"}`}>
                            {mult.toFixed(2)}×
                          </td>
                          <td className="px-5 py-3">
                            <MiniBar value={t.bias_corrected_ctr} max={maxCtr + 2} colour="bg-violet-500/70" />
                          </td>
                          <td className={`px-5 py-3 text-right font-mono text-xs font-bold ${conf >= 1.0 ? "text-emerald-400" : conf >= 0.8 ? "text-indigo-400" : "text-red-400"}`}>
                            {(conf * 100).toFixed(0)}%
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500 tabular-nums font-mono text-xs">
                            {t.interaction_count}
                          </td>
                        </tr>
                      );
                    })}
                    {truthEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-gray-600 text-sm">
                          No truth data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-5">
              <SectionTitle>False Positives — High CTR, Low Truth Score</SectionTitle>
              <p className="text-xs text-gray-600">
                Products with ≥8% weighted CTR but truth score below 50% — possibly over-exposed or returning poorly.
              </p>
              {falsePositives.length === 0 ? (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
                  <p className="text-sm text-gray-600">No false positives detected — signals are consistent.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {falsePositives.map((t) => {
                    const intel = (intelligence.products as Record<string, ProductIntelligence>)[t.id];
                    return (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-red-900/40 bg-red-950/10 px-5 py-3">
                        <span className="font-semibold text-gray-200 text-sm">{productNameMap[t.id] ?? t.id}</span>
                        <div className="flex gap-4 text-xs font-mono">
                          <span className="text-emerald-400">{intel?.weighted_ctr.toFixed(1)}% CTR</span>
                          <span className="text-red-400">{(t.truth_score * 100).toFixed(0)}% Truth</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-5">
              <SectionTitle>Position Bias Analysis — CTR vs Bias-Corrected CTR</SectionTitle>
              <p className="text-xs text-gray-600">
                Products where raw CTR and bias-corrected CTR differ by ≥2.5pp — indicates strong position effects.
              </p>
              {biasHeavy.length === 0 ? (
                <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
                  <p className="text-sm text-gray-600">No significant position bias detected.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-800 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/60">
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Product</th>
                        <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Weighted CTR</th>
                        <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Bias-Corr CTR</th>
                        <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Δ Bias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {biasHeavy.map((t) => {
                        const intel = (intelligence.products as Record<string, ProductIntelligence>)[t.id];
                        const delta = intel ? intel.weighted_ctr - t.bias_corrected_ctr : 0;
                        return (
                          <tr key={t.id} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                            <td className="px-5 py-3 font-semibold text-gray-200">{productNameMap[t.id] ?? t.id}</td>
                            <td className="px-5 py-3 text-right font-mono text-xs text-indigo-400 tabular-nums">{intel?.weighted_ctr.toFixed(1)}%</td>
                            <td className="px-5 py-3 text-right font-mono text-xs text-gray-400 tabular-nums">{t.bias_corrected_ctr.toFixed(1)}%</td>
                            <td className={`px-5 py-3 text-right font-mono font-bold text-xs tabular-nums ${delta > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                              {delta > 0 ? "+" : ""}{delta.toFixed(1)}pp
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── SYSTEM HEALTH ────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "health" && (
          <div className="space-y-10 animate-fade-in">

            <section className="space-y-5">
              <SectionTitle>Confidence Distribution</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="High Confidence"
                  value={confidenceTiers.high}
                  sub="≥50 interactions · 1.0× weight"
                  colour="green"
                />
                <StatCard
                  label="Mid Confidence"
                  value={confidenceTiers.mid}
                  sub="10–49 interactions · 0.8× weight"
                  colour="indigo"
                />
                <StatCard
                  label="Low Confidence"
                  value={confidenceTiers.low}
                  sub="<10 interactions · 0.5× weight"
                  colour="red"
                />
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                {(["high", "mid", "low"] as const).map((tier) => {
                  const total = truthEntries.length || 1;
                  const count = confidenceTiers[tier];
                  const barCol = tier === "high" ? "bg-emerald-500" : tier === "mid" ? "bg-indigo-500" : "bg-red-500";
                  return (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 capitalize">{tier} confidence</span>
                        <span className="font-mono text-gray-500 tabular-nums">{pct(count, total)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${barCol} h-full rounded-full transition-all duration-700`}
                          style={{ width: `${pct(count, total)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-5">
              <SectionTitle>Signal Quality</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Signal-to-Noise"
                  value={stnRaw !== null ? `${stnRaw.toFixed(1)}%` : "—"}
                  sub="outcome / interaction events"
                  colour={stnRaw !== null && stnRaw >= 5 ? "green" : "default"}
                />
                <StatCard
                  label="Outcome Completeness"
                  value={`${pct(confirmed, clicked)}%`}
                  sub="confirmed / affiliate clicks"
                  colour={pct(confirmed, clicked) >= 10 ? "green" : pct(confirmed, clicked) > 0 ? "indigo" : "default"}
                />
                <StatCard
                  label="Truth Coverage"
                  value={`${truthEntries.length} / ${productEntries.length}`}
                  sub="products with truth data"
                  colour="indigo"
                />
              </div>
            </section>

            <section className="space-y-5">
              <SectionTitle>Outcome Signal Breakdown (Local Session)</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Event</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Count</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Signal</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ["conversion_confirmed", "Positive", "text-emerald-400", "+1.0×"],
                      ["product_revisited",    "Positive", "text-violet-400",  "+0.4×"],
                      ["conversion_failed",    "Negative", "text-red-400",     "−0.3×"],
                      ["product_returned",     "Negative", "text-red-500",     "−0.6×"],
                    ] as const).map(([type, signal, col, weight]) => (
                      <tr key={type} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                        <td className="px-5 py-3"><Chip type={type} /></td>
                        <td className="px-5 py-3 text-right text-gray-400 tabular-nums font-mono">{countType(localEvents, type)}</td>
                        <td className={`px-5 py-3 text-right text-xs font-bold ${col}`}>{signal}</td>
                        <td className={`px-5 py-3 text-right font-mono text-xs font-bold ${col}`}>{weight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── V6 OPERATOR ──────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "v6" && (
          <div className="space-y-10 animate-fade-in">

            {/* Opportunity summary */}
            <section className="space-y-5">
              <SectionTitle>Business Opportunities Detected</SectionTitle>
              {v6Opportunities.length === 0 ? (
                <p className="text-sm text-gray-500">No opportunities above urgency floor. Accumulate more session data.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(() => {
                    const summary = summariseOpportunities(v6Opportunities);
                    return (Object.entries(summary) as [string, number][])
                      .filter(([, count]) => count > 0)
                      .map(([type, count]) => (
                        <StatCard
                          key={type}
                          label={type.replace(/_/g, " ")}
                          value={count}
                          colour={count >= 3 ? "amber" : count >= 1 ? "indigo" : "default"}
                        />
                      ));
                  })()}
                </div>
              )}
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Opportunity</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Urgency</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Confidence</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden lg:table-cell">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v6Opportunities.slice(0, 10).map((opp, i) => (
                      <tr key={i} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-semibold text-gray-200 text-sm">{opp.name}</span>
                          <span className="ml-2 text-[10px] font-mono text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded">{opp.type.replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-mono text-amber-400">{(opp.urgency * 100).toFixed(0)}%</td>
                        <td className="px-5 py-3 text-right tabular-nums font-mono text-emerald-400">{(opp.confidence * 100).toFixed(0)}%</td>
                        <td className="px-5 py-3 text-xs text-gray-500 hidden lg:table-cell">{opp.evidence}</td>
                      </tr>
                    ))}
                    {v6Opportunities.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-600 text-sm">No opportunities detected</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Strategy actions */}
            <section className="space-y-5">
              <SectionTitle>Autonomous Strategy Actions</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Action</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Target</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Priority</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Est. Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v6Strategies.slice(0, 8).map((s, i) => (
                      <tr key={i} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-mono text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded">{s.action.replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-gray-200">{s.target}</td>
                        <td className="px-5 py-3 text-right tabular-nums font-mono text-indigo-400">{(s.priority * 100).toFixed(0)}%</td>
                        <td className="px-5 py-3 text-right tabular-nums font-mono text-emerald-400">+{(s.expectedRevenueImpact * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                    {v6Strategies.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-600 text-sm">No strategies generated</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* v5 performance store */}
            {v6PerfStore && (
              <section className="space-y-5">
                <SectionTitle>Variant Performance (v5)</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["A","B","C","D"] as const).map((id) => {
                    const m   = v6PerfStore[id];
                    const ctr = m.pageViews > 0 ? ((m.affiliateClicks / m.pageViews) * 100).toFixed(1) : "—";
                    return (
                      <StatCard
                        key={id}
                        label={`Variant ${id}`}
                        value={`${ctr}% CTR`}
                        sub={`${m.pageViews} views · $${m.estimatedRevenue.toFixed(2)}`}
                        colour={m.affiliateClicks > 0 ? "green" : "default"}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* Category performance scores */}
            <section className="space-y-5">
              <SectionTitle>Simulated Revenue Growth</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Strategies Generated"
                  value={v6Strategies.length}
                  sub="this session"
                  colour="indigo"
                />
                <StatCard
                  label="Est. Max Impact"
                  value={v6Strategies.length > 0
                    ? `+${(Math.max(...v6Strategies.map((s) => s.expectedRevenueImpact)) * 100).toFixed(0)}%`
                    : "—"}
                  sub="top strategy"
                  colour={v6Strategies.length > 0 ? "green" : "default"}
                />
                <StatCard
                  label="Opportunities"
                  value={v6Opportunities.length}
                  sub={`${v6Opportunities.filter((o) => o.urgency >= 0.75).length} high urgency`}
                  colour={v6Opportunities.length > 0 ? "amber" : "default"}
                />
              </div>
            </section>

            {/* Autonomous decision log */}
            <section className="space-y-5">
              <SectionTitle>Autonomous Decision Log</SectionTitle>
              {v6DecisionLog.length === 0 ? (
                <p className="text-sm text-gray-500">No decisions logged yet. Run a full loop cycle to populate.</p>
              ) : (
                <div className="rounded-2xl border border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/60">
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Action</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Target</th>
                        <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Impact</th>
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden lg:table-cell">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v6DecisionLog.slice(0, 15).map((entry, i) => (
                        <tr key={i} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                          <td className="px-5 py-3">
                            <span className="text-[10px] font-mono text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded">{entry.action.replace(/_/g, " ")}</span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-gray-200">{entry.target}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-emerald-400">+{(entry.impact * 100).toFixed(0)}%</td>
                          <td className="px-5 py-3 text-xs text-gray-500 hidden lg:table-cell">{entry.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── V7 ECOSYSTEM ─────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "v7" && (
          <div className="space-y-10 animate-fade-in">

            {/* Ecosystem summary */}
            <section className="space-y-5">
              <SectionTitle>Ecosystem Overview</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Active Nodes"
                  value={v7EcoState ? v7EcoState.nodes.filter((n) => n.status === "active").length : "—"}
                  sub="deployed instances"
                  colour="indigo"
                />
                <StatCard
                  label="Seeding Nodes"
                  value={v7EcoState ? v7EcoState.nodes.filter((n) => n.status === "seeding").length : "—"}
                  sub="building traffic"
                  colour="amber"
                />
                <StatCard
                  label="Sim. Monthly Revenue"
                  value={v7Snapshot ? `$${v7Snapshot.totalRevenue.toFixed(0)}` : "—"}
                  sub="across all nodes"
                  colour={v7Snapshot && v7Snapshot.totalRevenue > 0 ? "green" : "default"}
                />
                <StatCard
                  label="Evolution Cycles"
                  value={v7EcoState ? v7EcoState.cycleCount : 0}
                  sub="ticks run"
                  colour="default"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRunEvolution}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
                >
                  Run Evolution Tick
                </button>
              </div>
            </section>

            {/* Node performance ranking */}
            <section className="space-y-5">
              <SectionTitle>Node Performance Ranking</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Rank</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Niche</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden lg:table-cell">Domain</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Traffic</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Sim. Rev.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(v7EcoState ? rankNodes(v7EcoState.nodes) : []).map((node) => {
                      const sim = v7Snapshot?.deployments.find((d) => d.nodeId === node.nodeId);
                      const statusColour: Record<string, string> = {
                        active: "text-emerald-400", seeding: "text-amber-400",
                        deprioritised: "text-red-400", cloned: "text-indigo-400",
                      };
                      return (
                        <tr key={node.nodeId} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                          <td className="px-5 py-3 font-mono text-gray-500 text-xs">#{node.rank}</td>
                          <td className="px-5 py-3 font-semibold text-gray-200">{node.niche}</td>
                          <td className="px-5 py-3 text-xs text-gray-500 hidden lg:table-cell font-mono">{node.domain}</td>
                          <td className={`px-5 py-3 text-right text-xs font-bold ${statusColour[node.status] ?? "text-gray-400"}`}>{node.status}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-gray-400">{(node.trafficShare * 100).toFixed(0)}%</td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-emerald-400">${sim ? sim.simulatedRevenue.toFixed(0) : "0"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Strategy propagation */}
            <section className="space-y-5">
              <SectionTitle>Intelligence Network — Top Intents</SectionTitle>
              {v7TopIntents.length === 0 ? (
                <p className="text-sm text-gray-500">Run an evolution tick to populate the intelligence network.</p>
              ) : (
                <div className="rounded-2xl border border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-900/60">
                        <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Intent</th>
                        <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Conv. Rate</th>
                        <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Frequency</th>
                        <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v7TopIntents.map((intent, i) => (
                        <tr key={i} className="border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors">
                          <td className="px-5 py-3 font-semibold text-gray-200">{intent.key}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-emerald-400">{(intent.conversionRate * 100).toFixed(1)}%</td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-gray-400">{intent.frequency}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-indigo-400">{(intent.confidence * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Revenue categories */}
            <section className="space-y-5">
              <SectionTitle>Top Revenue Categories (Shared Network)</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {v7TopCats.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-3">No revenue data yet. Run an evolution tick.</p>
                ) : v7TopCats.map((cat, i) => (
                  <StatCard
                    key={i}
                    label={cat.category}
                    value={`$${cat.avgRevenue.toFixed(2)}`}
                    sub={`peak $${cat.peakRevenue.toFixed(2)} · ${cat.observedCount} obs.`}
                    colour={cat.avgRevenue >= 10 ? "green" : cat.avgRevenue >= 1 ? "indigo" : "default"}
                  />
                ))}
              </div>
            </section>

            {/* Ecosystem revenue simulation */}
            <section className="space-y-5">
              <SectionTitle>Ecosystem Revenue Simulation</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                  label="Total Simulated Revenue"
                  value={v7Snapshot ? `$${v7Snapshot.totalRevenue.toFixed(2)}` : "—"}
                  sub="combined monthly projection"
                  colour="green"
                />
                <StatCard
                  label="Dominant Niche"
                  value={v7EcoState ? (rankNodes(v7EcoState.nodes)[0]?.niche ?? "—") : "—"}
                  sub="highest efficiency node"
                  colour="indigo"
                />
                <StatCard
                  label="Total Nodes"
                  value={v7EcoState ? v7EcoState.nodes.length : 0}
                  sub={`gen. ${v7EcoState ? Math.max(0, ...v7EcoState.nodes.map((n) => n.generation)) : 0} max`}
                  colour="default"
                />
              </div>
            </section>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ── V8 ECONOMY ───────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === "v8" && (
          <div className="space-y-10 animate-fade-in">

            {/* Macro metrics */}
            <section className="space-y-5">
              <SectionTitle>Economic Physics — System State</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Equilibrium State"
                  value={v8Snapshot?.equilibrium.state ?? "—"}
                  sub={v8Snapshot?.equilibrium.summary?.slice(0, 40) ?? "run a tick to initialise"}
                  colour={v8Snapshot?.equilibrium.state === "stable" ? "green" : v8Snapshot?.equilibrium.state === "chaotic" ? "red" : "amber"}
                />
                <StatCard
                  label="Stability Score"
                  value={v8Snapshot ? `${(v8Snapshot.equilibrium.stabilityScore * 100).toFixed(0)}%` : "—"}
                  sub="0% chaos → 100% stable"
                  colour={v8Snapshot && v8Snapshot.equilibrium.stabilityScore >= 0.6 ? "green" : "default"}
                />
                <StatCard
                  label="Attention HHI"
                  value={v8Snapshot ? v8Snapshot.attentionMarket.hhi.toFixed(3) : "—"}
                  sub="<0.15 competitive · >0.25 concentrated"
                  colour={v8Snapshot && v8Snapshot.attentionMarket.hhi > 0.25 ? "red" : "default"}
                />
                <StatCard
                  label="Strategy Mutation Rate"
                  value={v8Snapshot ? `${(v8Snapshot.fieldResult.mutationRate * 100).toFixed(0)}%` : "—"}
                  sub="agents mutated this tick"
                  colour={v8Snapshot && v8Snapshot.fieldResult.mutationRate > 0.5 ? "amber" : "default"}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRunEconomicTick}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                >
                  Run Economic Tick
                </button>
                <span className="text-xs text-gray-600 self-center">Tick #{v8Snapshot?.tick ?? 0}</span>
              </div>
            </section>

            {/* Attention distribution */}
            <section className="space-y-5">
              <SectionTitle>Attention Distribution Map</SectionTitle>
              <div className="rounded-2xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-gray-900/60">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Agent (Niche)</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Attention</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Conv. Efficiency</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">Conv. Physics</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-semibold text-[11px] uppercase tracking-wider hidden lg:table-cell">Friction Penalty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(v8Snapshot?.agents ?? []).map((agent) => {
                      const alloc = v8Snapshot?.attentionMarket.allocations.find((a) => a.agentId === agent.agentId);
                      const conv  = v8Snapshot?.conversions.find((c) => c.agentId === agent.agentId);
                      const isDominant = agent.agentId === v8Snapshot?.attentionMarket.dominantAgentId;
                      return (
                        <tr key={agent.agentId} className={`border-b border-gray-800/40 last:border-0 hover:bg-gray-900/40 transition-colors ${isDominant ? "bg-indigo-950/20" : ""}`}>
                          <td className="px-5 py-3">
                            <span className="font-semibold text-gray-200">{agent.niche}</span>
                            {isDominant && <span className="ml-2 text-[10px] text-indigo-400 font-mono bg-indigo-950/50 px-1.5 py-0.5 rounded">dominant</span>}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-amber-400">
                            {alloc ? `${(alloc.allocatedAttention * 100).toFixed(1)}%` : "—"}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-indigo-400">
                            {(agent.conversionEfficiency * 100).toFixed(1)}%
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-emerald-400">
                            {conv ? `${(conv.finalConversion * 100).toFixed(2)}%` : "—"}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-mono text-red-400 hidden lg:table-cell">
                            {conv ? `−${(conv.frictionPenalty * 100).toFixed(0)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {!v8Snapshot && <tr><td colSpan={5} className="px-5 py-6 text-center text-gray-600 text-sm">Run a tick to initialise agents</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Strategy clusters */}
            <section className="space-y-5">
              <SectionTitle>Market Clusters</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(v8Snapshot?.equilibrium.clusters ?? []).map((cluster, i) => {
                  const typeColour: Record<string, "green"|"amber"|"red"> = { dominant: "green", competing: "amber", isolated: "red" };
                  return (
                    <StatCard
                      key={i}
                      label={`${cluster.clusterType} cluster`}
                      value={`${cluster.clusterIds.length} agent${cluster.clusterIds.length !== 1 ? "s" : ""}`}
                      sub={`fitness ${cluster.meanFitness.toFixed(3)} · ${(cluster.attentionShare * 100).toFixed(0)}% attn`}
                      colour={typeColour[cluster.clusterType] ?? "default"}
                    />
                  );
                })}
                {(!v8Snapshot || v8Snapshot.equilibrium.clusters.length === 0) && (
                  <p className="text-sm text-gray-500 col-span-3">No cluster data — run a tick.</p>
                )}
              </div>
            </section>

            {/* Emergent pattern alerts */}
            <section className="space-y-5">
              <SectionTitle>Emergent Pattern Alerts</SectionTitle>
              {!v8Snapshot || v8Snapshot.emergence.events.length === 0 ? (
                <p className="text-sm text-gray-500">No emergent patterns detected. Accumulate tick history.</p>
              ) : (
                <div className="space-y-3">
                  {v8Snapshot.emergence.events.map((event, i) => (
                    <div key={i} className="rounded-xl border border-amber-800/40 bg-amber-950/10 px-5 py-4 flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded">{event.type.replace(/_/g, " ")}</span>
                          <span className="text-xs text-gray-500">tick #{event.tick}</span>
                        </div>
                        <p className="text-sm text-gray-300">{event.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-mono font-bold text-amber-400">{(event.strength * 100).toFixed(0)}%</span>
                        <p className="text-[10px] text-gray-600">strength</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Conversion physics index */}
            <section className="space-y-5">
              <SectionTitle>Conversion Physics Index</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Total Conversion Force"
                  value={v8Snapshot ? `${(v8Snapshot.totalConversion * 100).toFixed(2)}%` : "—"}
                  sub="sum across all agents"
                  colour={v8Snapshot && v8Snapshot.totalConversion > 0.5 ? "green" : "default"}
                />
                <StatCard
                  label="Mean Agent Fitness"
                  value={v8Snapshot ? v8Snapshot.meanFitness.toFixed(4) : "—"}
                  sub="composite fitness score"
                  colour="indigo"
                />
                <StatCard
                  label="Gini Coefficient"
                  value={v8Snapshot ? v8Snapshot.attentionMarket.giniCoeff.toFixed(3) : "—"}
                  sub="attention inequality"
                  colour={v8Snapshot && v8Snapshot.attentionMarket.giniCoeff > 0.5 ? "amber" : "default"}
                />
                <StatCard
                  label="Emergence Alerts"
                  value={v8Snapshot ? v8Snapshot.emergence.alertCount : 0}
                  sub={v8Snapshot?.emergence.dominantPattern?.replace(/_/g, " ") ?? "none detected"}
                  colour={v8Snapshot && v8Snapshot.emergence.alertCount > 2 ? "red" : v8Snapshot && v8Snapshot.emergence.alertCount > 0 ? "amber" : "default"}
                />
              </div>
            </section>

          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="px-6 py-5 border-t border-gray-800/50 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-700">
          <span>DEN v8 — Economic Physics Simulation</span>
          <div className="flex items-center gap-4">
            <Link href="/admin/growth" className="hover:text-violet-400 transition-colors">Growth Layer →</Link>
            <Link href="/admin/ael" className="hover:text-violet-400 transition-colors">AEL →</Link>
            <Link href="/" className="hover:text-indigo-400 transition-colors">← Back to site</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
