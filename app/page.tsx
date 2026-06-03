import Link from "next/link";
import { CATEGORY_META, getAllCategories } from "@/lib/category";
import type { CategoryKey } from "@/types/product";

const CATEGORY_ICONS: Record<CategoryKey, string> = {
  laptops:  "💻",
  phones:   "📱",
  monitors: "🖥",
  tablets:  "📲",
  pcs:      "⚡",
};

const STEPS = [
  {
    n:    "01",
    title: "Tell us what you need",
    body:  "Answer 6 quick questions about your use case, budget and preferences.",
  },
  {
    n:    "02",
    title: "Engine scores every option",
    body:  "Our truth-calibrated intelligence ranks products across multiple real-world dimensions.",
  },
  {
    n:    "03",
    title: "Get bias-corrected picks",
    body:  "See outcome-verified, segment-aware recommendations — not just popularity.",
  },
];

const SIGNALS = [
  "Truth-calibrated signals",
  "Position-bias corrected",
  "Segment-aware matching",
  "Learns from every session",
];

export default function LandingPage() {
  const categories = getAllCategories();

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold tracking-tight shadow-lg shadow-indigo-900/50">
            D
          </span>
          <span className="font-semibold text-white tracking-tight">DEN</span>
          <span className="text-[10px] text-gray-600 font-mono bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded-md">
            v4
          </span>
        </div>
        <Link
          href="/admin"
          className="text-xs text-gray-500 hover:text-indigo-400 transition-colors font-medium flex items-center gap-1"
        >
          Analytics
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </nav>

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pt-24 pb-20">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/7 rounded-full blur-3xl" />
            <div className="absolute top-[60px] left-[20%] w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-950/70 border border-indigo-800/50 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300 tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ animation: "den-fade-in 1s ease infinite alternate" }} />
              Decision Intelligence — v4
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.07] tracking-tight">
              Stop scrolling Reddit.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                Get your perfect match.
              </span>
            </h1>

            {/* Sub */}
            <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
              Answer 6 questions. We score your answers against real purchase outcomes —
              not just what got the most clicks.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quiz?category=laptops"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-indigo-900/40 text-sm"
              >
                Start Finding My Match
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <span className="text-xs text-gray-600">6 steps · No sign-up · Completely free</span>
            </div>

            {/* Signals strip */}
            <div className="flex items-center justify-center gap-5 flex-wrap pt-2">
              {SIGNALS.map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="text-indigo-500 font-bold">✓</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Category grid ────────────────────────────────── */}
        <section className="px-6 py-16 max-w-3xl mx-auto">
          <div className="space-y-6">
            <p className="text-center text-xs font-semibold tracking-widest text-gray-500 uppercase">
              Choose a Category
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((key) => {
                const meta  = CATEGORY_META[key];
                const isLive = key === "laptops" || key === "phones";
                return (
                  <Link
                    key={key}
                    href={`/quiz?category=${key}`}
                    className="group flex flex-col gap-3 bg-gray-900 hover:bg-gray-800/80 border border-gray-800 hover:border-indigo-500/50 rounded-2xl px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-900/15"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-2xl">{CATEGORY_ICONS[key]}</span>
                      {isLive ? (
                        <span className="text-[10px] font-bold tracking-wide bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full uppercase">
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-wide bg-gray-800 text-gray-600 border border-gray-700 px-2 py-0.5 rounded-full uppercase">
                          Beta
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors text-sm">
                        {meta.label}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {meta.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto space-y-10">
            <p className="text-center text-xs font-semibold tracking-widest text-gray-500 uppercase">
              How It Works
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {STEPS.map(({ n, title, body }) => (
                <div key={n} className="space-y-3">
                  <div className="text-4xl font-black text-indigo-500/20 font-mono tracking-tighter leading-none">
                    {n}
                  </div>
                  <h3 className="font-semibold text-white text-sm">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Intelligence callout ──────────────────────────── */}
        <section className="px-6 py-12 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <div className="flex-1 space-y-2">
                  <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
                    What makes DEN different
                  </p>
                  <h2 className="text-xl font-bold text-white">
                    Built on truth signals, not popularity
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                    Most recommendation engines optimize for clicks. DEN tracks real purchase
                    outcomes — returns, revisits, conversions — and corrects for position bias
                    before scoring your match.
                  </p>
                </div>
                <div className="shrink-0">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 border border-gray-700 hover:border-indigo-500/50 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700/80 font-medium px-4 py-2.5 rounded-xl text-sm transition-all duration-150"
                  >
                    View Analytics
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-gray-800/50">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© 2025 DEN — Decision Intelligence Platform</span>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-indigo-400 transition-colors">Analytics</Link>
            <Link href="/quiz?category=laptops" className="hover:text-indigo-400 transition-colors">Start Quiz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
