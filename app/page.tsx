/**
 * DEN Homepage — Server Component
 *
 * Reads x-vercel-ip-country header to determine whether to show the
 * UK-only Beauty category. All other categories are shown globally.
 */

import type React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getPublicCategories } from "@/lib/den-categories";
import type { DenTopCategory } from "@/lib/den-categories";

// ─── Category icons ────────────────────────────────────────────────────────────

function ElectronicsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function FinanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20V12M8 20V8M13 20V4M18 20v-6" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

function HealthIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function TravelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BusinessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function BeautyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88" />
      <path d="M14.47 14.48L20 20" />
      <path d="M8.12 8.12L12 12" />
    </svg>
  );
}

// ─── Utility icons ─────────────────────────────────────────────────────────────

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ─── Category icon map ─────────────────────────────────────────────────────────

const CAT_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  electronics: ElectronicsIcon,
  finance:     FinanceIcon,
  home:        HomeIcon,
  health:      HealthIcon,
  travel:      TravelIcon,
  business:    BusinessIcon,
  beauty:      BeautyIcon,
};

// ─── Badge component ───────────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: DenTopCategory }) {
  if (cat.id === "electronics") {
    return (
      <span className="text-[10px] font-bold tracking-wide bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full uppercase">
        Live
      </span>
    );
  }
  if (cat.locationBadge) {
    return (
      <span className="text-[10px] font-medium text-indigo-400/70 border border-indigo-900/40 px-2 py-0.5 rounded-full">
        {cat.locationBadge}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold tracking-wide bg-gray-800/80 text-gray-600 border border-gray-700/60 px-2 py-0.5 rounded-full uppercase">
      Soon
    </span>
  );
}

// ─── How it works ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    n:     "01",
    title: "Ingestion",
    body:  "Strips marketing copy and extracts verified specifications from real purchase data across thousands of outcomes.",
  },
  {
    n:     "02",
    title: "Correlation",
    body:  "Identifies patterns across returns, revisits, and satisfaction signals — weighted for your use case and budget.",
  },
  {
    n:     "03",
    title: "Synthesis",
    body:  "Assigns calibrated match scores against your profile. One ranked output. No hedging.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const headersList = headers();
  const isUK        = (headersList.get("x-vercel-ip-country") ?? "") === "GB";
  const categories  = getPublicCategories(isUK);

  // Split categories for the asymmetric grid layout
  const electronics = categories.find(c => c.id === "electronics")!;
  const beauty      = categories.find(c => c.id === "beauty");          // undefined outside UK
  const business    = categories.find(c => c.id === "business")!;
  // Finance, Home, Health, Travel — displayed in 2-col grid
  const midCats     = categories.filter(c => !["electronics", "beauty", "business"].includes(c.id));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-950 text-gray-300">

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold tracking-tight text-white" aria-hidden="true">
            D
          </span>
          <span className="font-semibold text-white tracking-tight">DEN</span>
        </div>
        <Link
          href="/electronics"
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors duration-150 font-medium py-2 px-1"
        >
          Start →
        </Link>
      </nav>

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative px-6 pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
          {/* Ambient background accent — barely visible */}
          <div
            className="absolute top-0 right-0 w-[480px] h-[480px] bg-indigo-600/[0.04] rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto">
            <div className="max-w-[38rem] space-y-7 animate-slide-up">

              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 border border-indigo-800/50 rounded-full px-3.5 py-1 text-[11px] font-semibold text-indigo-400 tracking-widest uppercase">
                Decision Intelligence
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-[5.5rem] font-bold tracking-tighter leading-none text-white">
                Stop scrolling
                <br />
                Reddit.
                <br />
                <span className="text-indigo-400">Get your match.</span>
              </h1>

              {/* Body */}
              <p className="text-base text-gray-400 leading-relaxed max-w-[52ch]">
                Answer a few questions about use case, budget, and priorities.
                We rank against real purchase outcomes — not what paid the most.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-1">
                <Link
                  href="/electronics"
                  className="inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:-translate-y-[1px] text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-indigo-900/30"
                >
                  Find My Match
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-gray-600 tracking-wide">Free · No sign-up · 60 seconds</span>
              </div>

              {/* Trust signals */}
              <div className="flex items-center gap-6 flex-wrap pt-1">
                {[
                  "Ranked by real outcomes",
                  "No sponsored results",
                  "No account required",
                ].map((s) => (
                  <div key={s} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CheckIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── Category grid ─────────────────────────────────── */}
        <section className="px-6 pb-20 max-w-7xl mx-auto space-y-3">

          {/* Electronics — featured, full-width */}
          <Link
            href={electronics.href}
            className="stagger-item group block bg-gray-900 hover:bg-gray-800/70 border border-gray-800 hover:border-indigo-800/50 rounded-2xl px-6 py-6 transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <ElectronicsIcon className="w-6 h-6 text-indigo-400" />
                <span className="font-bold text-white text-lg tracking-tight group-hover:text-indigo-300 transition-colors duration-150">
                  {electronics.label}
                </span>
              </div>
              <CategoryBadge cat={electronics} />
            </div>

            <p className="text-sm text-gray-500 leading-relaxed max-w-[60ch] mb-5">
              {electronics.tagline}
            </p>

            {/* Sub-category chips */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {electronics.subCategories.map((sub) => (
                <span
                  key={sub.id}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                    sub.comingSoon
                      ? "bg-gray-800/50 text-gray-600 border-gray-700/50"
                      : "bg-indigo-950/60 text-indigo-400 border-indigo-900/40"
                  }`}
                >
                  {sub.label}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors duration-150">
              <span>Start Quiz</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
            </div>
          </Link>

          {/* Finance + Home — 2-col */}
          {/* Health + Travel — 2-col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {midCats.map((cat, i) => {
              const Icon = CAT_ICON_MAP[cat.id] ?? ElectronicsIcon;
              return (
                <Link
                  key={cat.id}
                  href={cat.href}
                  style={{ "--index": i + 1 } as React.CSSProperties}
                  className="stagger-item group block bg-gray-900 hover:bg-gray-800/60 border border-gray-800 hover:border-gray-700 rounded-2xl px-5 py-5 transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors duration-150" />
                    <CategoryBadge cat={cat} />
                  </div>

                  <p className="font-semibold text-white group-hover:text-gray-100 transition-colors duration-150 text-sm mb-1.5">
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4 max-w-[38ch]">
                    {cat.tagline}
                  </p>

                  {/* Sub-category pills — muted, informational only */}
                  <div className="flex flex-wrap gap-1">
                    {cat.subCategories.slice(0, 3).map((sub) => (
                      <span key={sub.id} className="text-[10px] text-gray-700 border border-gray-800 px-2 py-0.5 rounded-full">
                        {sub.label}
                      </span>
                    ))}
                    {cat.subCategories.length > 3 && (
                      <span className="text-[10px] text-gray-700 border border-gray-800 px-2 py-0.5 rounded-full">
                        +{cat.subCategories.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Business — full-width, compact row */}
          {(() => {
            const Icon = CAT_ICON_MAP[business.id] ?? BusinessIcon;
            return (
              <Link
                href={business.href}
                style={{ "--index": 5 } as React.CSSProperties}
                className="stagger-item group flex items-center justify-between gap-6 bg-gray-900 hover:bg-gray-800/60 border border-gray-800 hover:border-gray-700 rounded-2xl px-6 py-5 transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors duration-150 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <span className="font-semibold text-white text-sm">{business.label}</span>
                      <CategoryBadge cat={business} />
                    </div>
                    <p className="text-xs text-gray-600 truncate max-w-[55ch]">{business.tagline}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
              </Link>
            );
          })()}

          {/* Beauty — UK-only booking, full-width */}
          {beauty && (() => {
            return (
              <Link
                href={beauty.href}
                style={{ "--index": 6 } as React.CSSProperties}
                className="stagger-item group block bg-gray-900 hover:bg-gray-800/70 border border-gray-800 hover:border-indigo-800/40 rounded-2xl px-6 py-6 transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BeautyIcon className="w-6 h-6 text-indigo-400/70" />
                    <span className="font-bold text-white text-lg tracking-tight group-hover:text-indigo-300 transition-colors duration-150">
                      {beauty.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CategoryBadge cat={beauty} />
                    <span className="text-[10px] font-bold tracking-wide bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full uppercase">
                      Live
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 leading-relaxed max-w-[60ch] mb-5">
                  {beauty.tagline}
                </p>

                {/* Treatment chips */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {beauty.subCategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full border bg-indigo-950/40 text-indigo-400/70 border-indigo-900/30"
                    >
                      {sub.label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-400/80 group-hover:text-indigo-300 transition-colors duration-150">
                  <span>Book Treatment</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                </div>
              </Link>
            );
          })()}

        </section>

        {/* ── How it works ──────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-gray-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-[5rem_1fr] gap-x-10 items-start">

              {/* Rotated label */}
              <div className="hidden md:flex items-start pt-1">
                <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">
                  The&nbsp;method
                </p>
              </div>

              {/* Steps */}
              <div className="divide-y divide-gray-800/60">
                {STEPS.map(({ n, title, body }) => (
                  <div key={n} className="grid grid-cols-[3rem_1fr] gap-6 py-6 first:pt-0 last:pb-0">
                    <span className="text-3xl font-bold text-indigo-600/30 font-mono tracking-tighter leading-none tabular-nums">
                      {n}
                    </span>
                    <div className="space-y-1.5 pt-1">
                      <h3 className="font-semibold text-white text-sm tracking-tight">{title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed max-w-[55ch]">{body}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* ── Why DEN ──────────────────────────────────────── */}
        <section className="px-6 py-16 border-t border-gray-800/50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-8">
            <div className="space-y-3 max-w-[38rem]">
              <p className="text-[11px] font-semibold tracking-widest text-indigo-400 uppercase">
                What makes DEN different
              </p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tighter leading-tight text-white">
                Built on outcomes, not opinions.
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[55ch]">
                Most recommendation engines rank by click-through or affiliate margin.
                DEN tracks what happens after the decision — returns, revisits, satisfaction
                signals — and weights every result against your specific profile.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/electronics"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:-translate-y-[1px] text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all duration-150"
              >
                Try it now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700">
          <span>© {new Date().getFullYear()} DEN</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors duration-150">
              Privacy
            </Link>
            <Link href="/electronics" className="hover:text-gray-400 transition-colors duration-150">
              Start Quiz →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
