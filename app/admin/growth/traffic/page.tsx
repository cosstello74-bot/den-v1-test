"use client";

/**
 * SEO traffic analytics dashboard.
 *
 * Shows:
 *   - Landing page performance by page type (category / seeding / generated)
 *   - Traffic source breakdown (simulated from event metadata)
 *   - Funnel metrics per traffic source
 *   - AEL intent priority queue
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AggregatedIntelligence } from "@/lib/learning/eventAggregator";
import type { IntentsFile } from "@/types/intent";
import FunnelChart from "@/components/Analytics/FunnelChart";

// ─── Landing page registry ────────────────────────────────────────────────────

type LandingPageEntry = {
  slug:     string;
  title:    string;
  type:     "category" | "seeding" | "generated";
  keywords: string[];
};

const LANDING_PAGES: LandingPageEntry[] = [
  { slug: "laptops",                   title: "Best Laptops",                    type: "category",  keywords: ["best laptops"] },
  { slug: "phones",                    title: "Best Smartphones",                type: "category",  keywords: ["best smartphones"] },
  { slug: "monitors",                  title: "Best Monitors",                   type: "category",  keywords: ["best monitors"] },
  { slug: "best-laptops-for-gaming",   title: "Best Laptops for Gaming",         type: "seeding",   keywords: ["best gaming laptops", "gaming laptop"] },
  { slug: "best-laptops-for-students", title: "Best Laptops for Students",       type: "seeding",   keywords: ["best student laptops", "university laptop"] },
  { slug: "best-budget-laptops",       title: "Best Budget Laptops",             type: "seeding",   keywords: ["budget laptops", "cheap laptops"] },
  { slug: "laptops-for-coding",        title: "Best Laptops for Coding",         type: "seeding",   keywords: ["best laptop for coding", "developer laptop"] },
  { slug: "work-from-home-laptops",    title: "Work-From-Home Laptops",          type: "seeding",   keywords: ["work from home laptops", "remote work laptop"] },
  { slug: "best-gaming-laptops-under-1000", title: "Gaming Laptops Under £1000", type: "generated", keywords: ["gaming laptops under 1000"] },
  { slug: "best-laptops-for-students", title: "Student Laptops (AEL)",           type: "generated", keywords: ["best laptops for students"] },
  { slug: "best-laptops-for-coding",   title: "Coding Laptops (AEL)",            type: "generated", keywords: ["best laptops for coding"] },
  { slug: "lightweight-laptops-for-travel", title: "Travel Laptops (AEL)",        type: "generated", keywords: ["lightweight travel laptops"] },
];

const PAGE_TYPE_STYLES: Record<LandingPageEntry["type"], string> = {
  category:  "text-indigo-400 bg-indigo-950/40 border-indigo-900/30",
  seeding:   "text-amber-400 bg-amber-950/30 border-amber-900/20",
  generated: "text-emerald-400 bg-emerald-950/30 border-emerald-900/20",
};

const PAGE_TYPE_LABELS: Record<LandingPageEntry["type"], string> = {
  category:  "GEO",
  seeding:   "Seeding",
  generated: "AEL",
};

// ─── Traffic source display ───────────────────────────────────────────────────

const TRAFFIC_CHANNELS = [
  { label: "Google Search",  source: "google",   channel: "organic_search", multiplier: "1.40×", intentQuality: "High",   colour: "text-blue-400"    },
  { label: "Bing",           source: "bing",     channel: "organic_search", multiplier: "1.25×", intentQuality: "High",   colour: "text-sky-400"     },
  { label: "Reddit",         source: "reddit",   channel: "social",         multiplier: "1.10×", intentQuality: "Medium", colour: "text-orange-400"  },
  { label: "Quora",          source: "quora",    channel: "referral",       multiplier: "1.15×", intentQuality: "High",   colour: "text-red-400"     },
  { label: "TikTok",         source: "tiktok",   channel: "social",         multiplier: "0.75×", intentQuality: "Low",    colour: "text-pink-400"    },
  { label: "Twitter / X",    source: "twitter",  channel: "social",         multiplier: "0.85×", intentQuality: "Low",    colour: "text-gray-400"    },
  { label: "Direct",         source: "direct",   channel: "direct",         multiplier: "1.00×", intentQuality: "Medium", colour: "text-gray-300"    },
];

// ─── Empty funnel ─────────────────────────────────────────────────────────────

const EMPTY_FUNNEL = {
  pageViews: 0, quizStarts: 0, quizCompletes: 0, resultsViews: 0,
  productViews: 0, affiliateClicks: 0,
  quizStartRate: 0, quizCompleteRate: 0, resultsViewRate: 0, clickThroughRate: 0,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrafficAnalyticsPage() {
  const [agg,     setAgg]     = useState<AggregatedIntelligence | null>(null);
  const [intents, setIntents] = useState<IntentsFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [evRes, intentRes] = await Promise.all([
          fetch("/api/events").catch(() => null),
          fetch("/api/ael/state").catch(() => null),
        ]);

        if (evRes?.ok) {
          const data = await evRes.json();
          if (data?.aggregated) setAgg(data.aggregated);
        }

        if (intentRes?.ok) {
          const data = await intentRes.json();
          if (data?.intents) setIntents({ updatedAt: data.updatedAt ?? "", intents: data.intents });
        }
      } catch {
        // graceful — show empty states
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const funnel = agg?.funnel ?? EMPTY_FUNNEL;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
              <span className="text-sm font-semibold text-white">DEN</span>
            </Link>
            <span className="text-gray-700">/</span>
            <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-300">Admin</Link>
            <span className="text-gray-700">/</span>
            <Link href="/admin/growth" className="text-xs text-gray-500 hover:text-gray-300">Growth</Link>
            <span className="text-gray-700">/</span>
            <span className="text-xs text-gray-300 font-medium">Traffic</span>
          </div>
          {loading && <span className="text-[10px] text-gray-600 animate-pulse">Loading…</span>}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">

        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Traffic Analytics</h1>
          <p className="text-sm text-gray-500">
            SEO landing page performance, traffic source revenue value, and intent pipeline status.
          </p>
        </div>

        {/* ── Funnel ────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Conversion Funnel</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <FunnelChart funnel={funnel} title="" />
          </div>
        </section>

        {/* ── Landing pages registry ─────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Landing Pages</h2>
            <div className="flex items-center gap-3 text-[10px]">
              {(["category", "seeding", "generated"] as const).map((t) => (
                <span key={t} className={`px-2 py-0.5 rounded-full border font-bold ${PAGE_TYPE_STYLES[t]}`}>
                  {PAGE_TYPE_LABELS[t]}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider">Page</th>
                  <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider hidden sm:table-cell">Target keywords</th>
                  <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider">Live</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {LANDING_PAGES.map((p) => (
                  <tr key={`${p.type}-${p.slug}`} className="hover:bg-gray-800/20">
                    <td className="px-5 py-3">
                      <div className="text-gray-200 font-medium text-xs">{p.title}</div>
                      <div className="text-[10px] text-gray-600">/{p.type === "generated" ? "generated/" : ""}{p.slug}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${PAGE_TYPE_STYLES[p.type]}`}>
                        {PAGE_TYPE_LABELS[p.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {p.keywords.map((kw) => (
                          <span key={kw} className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[10px] font-semibold text-emerald-400">✓ Live</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Traffic source value ───────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Traffic Source Revenue Value</h2>
          <p className="text-xs text-gray-600">
            Affiliate payout multiplier and intent quality per source. Guides traffic seeding channel priority.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRAFFIC_CHANNELS.map((ch) => (
              <div key={ch.source} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className={`text-sm font-semibold ${ch.colour}`}>{ch.label}</div>
                  <div className="text-[10px] text-gray-600">{ch.channel.replace("_", " ")}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="text-sm font-bold text-gray-200 tabular-nums">{ch.multiplier}</div>
                  <div className={`text-[10px] font-semibold ${
                    ch.intentQuality === "High"   ? "text-emerald-400" :
                    ch.intentQuality === "Medium" ? "text-amber-400"   :
                                                    "text-gray-600"
                  }`}>
                    {ch.intentQuality} intent
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Intent pipeline ────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Intent Pipeline</h2>
            <Link href="/admin/ael" className="text-xs text-indigo-400 hover:text-indigo-300">
              View AEL →
            </Link>
          </div>

          <div className="space-y-2">
            {(intents?.intents ?? []).slice(0, 8).map((intent) => (
              <div key={intent.id} className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-200">{intent.keyword}</div>
                  <div className="text-[10px] text-gray-600">{intent.category} · Vol ~{intent.estimatedVolume.toLocaleString()}/mo</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-bold tabular-nums text-indigo-400">{intent.priority}</div>
                  <div className="text-[10px] text-gray-600">priority</div>
                </div>
                <span className={`shrink-0 text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                  intent.status === "live"      ? "text-emerald-400 bg-emerald-950/30 border-emerald-900/20" :
                  intent.status === "pending"   ? "text-amber-400 bg-amber-950/30 border-amber-900/20"      :
                  intent.status === "generating"? "text-indigo-400 bg-indigo-950/30 border-indigo-900/20"   :
                                                  "text-gray-600 bg-gray-900 border-gray-800"
                }`}>
                  {intent.status}
                </span>
              </div>
            ))}

            {(!intents || intents.intents.length === 0) && (
              <p className="text-xs text-gray-600 py-4">
                No intent data loaded. Check <code className="text-gray-500">data/intents.json</code>.
              </p>
            )}
          </div>
        </section>

        {/* ── Footer nav ─────────────────────────────────────────── */}
        <div className="flex gap-4 pt-4 border-t border-gray-800/50 text-xs">
          <Link href="/admin/growth"     className="text-gray-500 hover:text-gray-300">← Revenue</Link>
          <Link href="/admin/growth/geo" className="text-gray-500 hover:text-gray-300">GEO Performance →</Link>
          <Link href="/admin/ael"        className="text-gray-500 hover:text-gray-300">AEL Dashboard →</Link>
        </div>

      </main>
    </div>
  );
}
