"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RevenueModelSnapshot, ProductRevenueData } from "@/lib/metrics/revenueMetrics";
import { SEGMENT_REVENUE_PROFILES }  from "@/lib/segmentRevenue";
import seedRevenue from "@/data/revenueModel.json";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtGbp(n: number): string {
  return `£${fmt(n, 2)}`;
}

function trendColor(trend: string): string {
  if (trend === "rising")   return "text-emerald-400";
  if (trend === "declining") return "text-red-400";
  return "text-gray-500";
}

function trendIcon(trend: string): string {
  if (trend === "rising")   return "↑";
  if (trend === "declining") return "↓";
  return "→";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-1">
      <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CategoryBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium capitalize">{label}</span>
        <span className="text-gray-500 tabular-nums">{fmtGbp(value)}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GrowthPage() {
  const [model, setModel] = useState<RevenueModelSnapshot>(seedRevenue as RevenueModelSnapshot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/revenue")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setModel(data as RevenueModelSnapshot); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Derived stats ───────────────────────────────────────────────────────────

  const products    = Object.entries(model.products) as [string, ProductRevenueData][];
  const categories  = Object.entries(model.categories);

  const totalRevenue     = products.reduce((s, [, d]) => s + d.totalRevenue, 0);
  const avgConvRate      = products.reduce((s, [, d]) => s + d.conversionRate, 0) / products.length;
  const avgPayout        = products.reduce((s, [, d]) => s + d.affiliatePayout, 0) / products.length;
  const risingCount      = products.filter(([, d]) => d.revenueTrend === "rising").length;
  const decliningCount   = products.filter(([, d]) => d.revenueTrend === "declining").length;

  const maxRevenue = Math.max(...products.map(([, d]) => d.totalRevenue));
  const maxCatRev  = Math.max(...categories.map(([, d]) => d.totalRevenue));

  // Sort by total revenue descending
  const sortedByRevenue = [...products].sort(([, a], [, b]) => b.totalRevenue - a.totalRevenue);

  // Efficiency: high conversion & low payout = efficient traffic driver
  const highCtrLowRev = products.filter(([, d]) => d.conversionRate >= 0.09 && d.totalRevenue < 300);
  // Low conversion & high payout = untapped high-value products
  const lowCtrHighVal = products.filter(([, d]) => d.conversionRate < 0.07 && d.affiliatePayout >= 60);

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
              <span className="text-sm font-semibold text-white">DEN</span>
            </Link>
            <span className="text-gray-700">/</span>
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Analytics</Link>
            <span className="text-gray-700">/</span>
            <span className="text-sm text-gray-300 font-medium">Growth</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {loading
              ? <span className="text-gray-600">Loading…</span>
              : <span className="text-emerald-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
            }
            <span className="text-gray-600 font-mono">
              {new Date(model.generatedAt).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="space-y-1 animate-fade-in">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Growth Layer</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-900/50 text-violet-400 border border-violet-800/50 px-2 py-0.5 rounded-full">
              Revenue Intelligence
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Affiliate revenue metrics, segment efficiency, and product monetisation signals.
          </p>
        </div>

        {/* ── Revenue Overview ─────────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-75">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Revenue Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Revenue"
              value={fmtGbp(totalRevenue)}
              sub={`${products.length} products`}
              accent="text-indigo-400"
            />
            <StatCard
              label="Avg Conversion Rate"
              value={`${(avgConvRate * 100).toFixed(1)}%`}
              sub="across all products"
            />
            <StatCard
              label="Avg Affiliate Payout"
              value={fmtGbp(avgPayout)}
              sub="per conversion"
            />
            <StatCard
              label="Trend Signals"
              value={`${risingCount} rising`}
              sub={`${decliningCount} declining`}
              accent="text-emerald-400"
            />
          </div>
        </section>

        {/* ── Product Revenue Performance ──────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-150">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Product Revenue Performance</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Product</th>
                  <th className="text-right px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Payout</th>
                  <th className="text-right px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Conv. Rate</th>
                  <th className="text-right px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Revenue</th>
                  <th className="px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold w-32">Volume</th>
                  <th className="text-center px-5 py-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {sortedByRevenue.map(([pid, data]) => (
                  <tr key={pid} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{pid}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-300">
                      {fmtGbp(data.affiliatePayout)}
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums">
                      <span className={data.conversionRate >= 0.09 ? "text-emerald-400" : data.conversionRate < 0.06 ? "text-red-400" : "text-gray-300"}>
                        {(data.conversionRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-white">
                      {fmtGbp(data.totalRevenue)}
                    </td>
                    <td className="px-5 py-3.5">
                      <MiniBar value={data.totalRevenue} max={maxRevenue} color="bg-indigo-600/70" />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`font-bold ${trendColor(data.revenueTrend)}`}>
                        {trendIcon(data.revenueTrend)} {data.revenueTrend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Efficiency Analysis ──────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Efficiency Signals</h2>
          <div className="grid md:grid-cols-2 gap-4">

            {/* High conversion, low revenue — promote more */}
            <div className="bg-gray-900 border border-emerald-900/40 rounded-xl p-5 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  High Conv. · Low Revenue
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Converting well but under-monetised — increase traffic to these products.
                </p>
              </div>
              {highCtrLowRev.length === 0
                ? <p className="text-xs text-gray-600 italic">No products match this pattern.</p>
                : <ul className="space-y-2">
                    {highCtrLowRev.map(([pid, data]) => (
                      <li key={pid} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{pid}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-400">{(data.conversionRate * 100).toFixed(1)}% conv</span>
                          <span className="text-gray-500">{fmtGbp(data.totalRevenue)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
              }
            </div>

            {/* Low conversion, high payout — optimise landing */}
            <div className="bg-gray-900 border border-amber-900/40 rounded-xl p-5 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Low Conv. · High Payout
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  High revenue potential per sale — optimise conversion or landing experience.
                </p>
              </div>
              {lowCtrHighVal.length === 0
                ? <p className="text-xs text-gray-600 italic">No products match this pattern.</p>
                : <ul className="space-y-2">
                    {lowCtrHighVal.map(([pid, data]) => (
                      <li key={pid} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{pid}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-amber-400">{fmtGbp(data.affiliatePayout)} payout</span>
                          <span className="text-gray-500">{(data.conversionRate * 100).toFixed(1)}% conv</span>
                        </div>
                      </li>
                    ))}
                  </ul>
              }
            </div>
          </div>
        </section>

        {/* ── Segment Revenue Profiles ─────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-250">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Segment Revenue Profiles</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(Object.entries(SEGMENT_REVENUE_PROFILES) as [string, { multiplier: number; avgOrderValue: string; description: string }][]).map(([seg, profile]) => {
              const isTop = profile.multiplier >= 1.15;
              return (
                <div
                  key={seg}
                  className={`bg-gray-900 border rounded-xl p-4 space-y-2 ${isTop ? "border-indigo-800/60" : "border-gray-800"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold capitalize text-gray-300">{seg}</p>
                    <span className={`text-xs font-bold tabular-nums ${isTop ? "text-indigo-400" : "text-gray-500"}`}>
                      {profile.multiplier}×
                    </span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isTop ? "bg-indigo-600" : "bg-gray-700"}`}
                      style={{ width: `${(profile.multiplier / 1.3) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 leading-snug">{profile.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Category Revenue Bars ────────────────────────────────────── */}
        <section className="space-y-4 animate-fade-in delay-300">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Category Revenue</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue by Category</p>
                <div className="space-y-3">
                  {categories.map(([cat, data]) => (
                    <CategoryBar key={cat} label={cat} value={data.totalRevenue} max={maxCatRev} />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Per Session (RPS)</p>
                <div className="space-y-3">
                  {[...categories]
                    .sort(([, a], [, b]) => b.revenuePerSession - a.revenuePerSession)
                    .map(([cat, data]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 capitalize font-medium w-24">{cat}</span>
                        <div className="flex-1 mx-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                            style={{ width: `${(data.revenuePerSession / 3.0) * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-300 tabular-nums font-semibold w-12 text-right">
                          {fmtGbp(data.revenuePerSession)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Category stats grid */}
            <div className="border-t border-gray-800 pt-5 grid grid-cols-5 gap-2">
              {categories.map(([cat, data]) => (
                <div key={cat} className="text-center space-y-1">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider capitalize">{cat}</p>
                  <p className="text-sm font-bold text-white">{fmtGbp(data.avgAffiliatePayout)}</p>
                  <p className="text-[10px] text-gray-600">avg payout</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer nav ───────────────────────────────────────────────── */}
        <div className="animate-fade-in delay-400 flex items-center justify-center gap-6 text-xs text-gray-600 pt-4 border-t border-gray-800/50">
          <Link href="/admin" className="hover:text-indigo-400 transition-colors">← Analytics Dashboard</Link>
          <Link href="/admin/growth/geo" className="hover:text-violet-400 transition-colors">GEO Dashboard →</Link>
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
        </div>

      </main>
    </div>
  );
}
