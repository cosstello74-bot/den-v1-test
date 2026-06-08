/**
 * DEN Homepage — Server Component (editorial redesign)
 */

import type React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getPublicCategories } from "@/lib/den-categories";
import type { DenTopCategory } from "@/lib/den-categories";

// ─── Logo mark ────────────────────────────────────────────────────────────────
// Simplified abstraction of the D speed-mark from the DEN logo
// (dots + horizontal data-stream bars)

function DenMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="1.5" cy="4.5"  r="1.2" fill="currentColor" opacity="0.55" />
      <circle cx="1.5" cy="9"    r="1.2" fill="currentColor" opacity="0.75" />
      <circle cx="1.5" cy="13.5" r="1.2" fill="currentColor" opacity="0.55" />
      <rect x="4.5" y="3.5"  width="4.5" height="2" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="4.5" y="8"    width="9"   height="2" rx="1" fill="currentColor" />
      <rect x="4.5" y="12.5" width="6"   height="2" rx="1" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

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

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
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

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ cat }: { cat: DenTopCategory }) {
  if (cat.id === "electronics") {
    return (
      <span className="text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
        Live
      </span>
    );
  }
  if (cat.locationBadge) {
    return (
      <span className="text-[10px] font-medium text-accent/80 border border-accent/30 px-2 py-0.5 rounded-full">
        {cat.locationBadge}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold tracking-wide bg-ink/6 text-muted border border-ink/12 px-2 py-0.5 rounded-full uppercase">
      Soon
    </span>
  );
}

// ─── Method steps ─────────────────────────────────────────────────────────────

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

  const electronics = categories.find(c => c.id === "electronics")!;
  const restCats    = categories.filter(c => c.id !== "electronics");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-ink">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 backdrop-blur-sm bg-paper/90 border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label="DEN home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="DEN — Decisions. Engineered. Now." className="h-9 w-auto" />
          </Link>
          <Link
            href="/electronics"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-dark transition-colors duration-150"
          >
            Start now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6">

          {/* Editorial identity bar */}
          <div className="flex items-center justify-between py-5 border-b border-ink/12">
            <div className="flex items-center gap-3">
              <DenMark className="w-4 h-4 text-accent" />
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-muted">
                Decisions. Engineered. Now.
              </p>
            </div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted/40 hidden sm:block">
              United Kingdom · Est. 2025
            </p>
          </div>

          {/* Main display headline */}
          <div className="py-16 md:py-24">
            <h1 className="text-[clamp(3rem,9vw,8.5rem)] font-bold tracking-tighter leading-[0.88] text-ink mb-10">
              Stop scrolling.<br />
              <span className="text-accent">Get your match.</span>
            </h1>

            {/* Sub-copy + CTA — editorial split layout */}
            <div className="border-t border-ink/10 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <p className="text-base md:text-lg text-muted leading-relaxed max-w-[44ch]">
                Answer a few questions about use case, budget, and priorities.
                We rank against real purchase outcomes — not what paid the highest commission.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Link
                  href="/electronics"
                  className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent-dark active:-translate-y-[1px] text-white font-semibold px-7 py-4 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-accent/20"
                >
                  Find My Match
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-muted/55">Free · No account · 60 seconds</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust strip ────────────────────────────────────────── */}
        <div className="border-y border-ink/10 bg-paper-soft overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center gap-8 overflow-x-auto scrollbar-none">
            {[
              "No sponsored results",
              "Ranked by real purchase outcomes",
              "No account required",
              "UK-focused recommendations",
              "Truth-calibrated scoring",
            ].map((s) => (
              <span key={s} className="flex items-center gap-2.5 text-[11px] text-muted whitespace-nowrap">
                <span className="w-1 h-1 rounded-full bg-accent shrink-0" aria-hidden="true" />
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* ── Categories ─────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 py-20">

          {/* Section label */}
          <div className="flex items-baseline justify-between pb-4 mb-1 border-b border-ink/12">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-muted">
              Choose a vertical
            </p>
            <p className="text-[10px] text-muted/40 tabular-nums">
              {categories.length} verticals
            </p>
          </div>

          {/* Electronics — hero row */}
          <Link
            href={electronics.href}
            className="group block py-10 border-b border-ink/10 -mx-4 px-4 hover:bg-paper-soft rounded-xl transition-colors duration-150"
          >
            <div className="grid grid-cols-1 md:grid-cols-[5.5rem_1fr_auto] gap-5 md:gap-10 items-start">
              <span
                className="text-[4.5rem] font-bold text-ink/[0.07] font-mono tracking-tighter leading-none tabular-nums select-none"
                aria-hidden="true"
              >
                01
              </span>
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight group-hover:text-accent transition-colors duration-150">
                    {electronics.label}
                  </h2>
                  <span className="text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                    Live now
                  </span>
                </div>
                <p className="text-sm text-muted leading-relaxed max-w-[55ch]">
                  {electronics.tagline}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {electronics.subCategories.map((sub) => (
                    <span
                      key={sub.id}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                        sub.comingSoon
                          ? "bg-ink/5 text-muted border-ink/10"
                          : "bg-accent/10 text-accent border-accent/30"
                      }`}
                    >
                      {sub.label}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted/25 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150 hidden md:block mt-1 shrink-0" />
            </div>
          </Link>

          {/* Remaining categories — numbered editorial list */}
          {restCats.map((cat, i) => {
            const Icon = CAT_ICON_MAP[cat.id] ?? ElectronicsIcon;
            const num  = String(i + 2).padStart(2, "0");
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className="group block border-b border-ink/10 -mx-4 px-4 py-7 hover:bg-paper-soft rounded-xl transition-colors duration-150"
              >
                <div className="grid grid-cols-[4rem_1fr_auto] gap-5 md:gap-8 items-center">
                  <span
                    className="text-3xl font-bold text-ink/[0.07] font-mono tracking-tighter leading-none tabular-nums select-none"
                    aria-hidden="true"
                  >
                    {num}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Icon className="w-4 h-4 text-muted/50 group-hover:text-muted transition-colors duration-150 shrink-0" />
                      <h3 className="font-semibold text-base text-ink group-hover:text-accent transition-colors duration-150 tracking-tight">
                        {cat.label}
                      </h3>
                      <StatusBadge cat={cat} />
                    </div>
                    <p className="text-xs text-muted leading-relaxed max-w-[52ch] pl-[1.4rem]">
                      {cat.tagline}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted/20 group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
                </div>
              </Link>
            );
          })}

        </section>

        {/* ── Method ─────────────────────────────────────────────── */}
        <section className="border-t border-ink/10 bg-paper-soft">
          <div className="max-w-7xl mx-auto px-6 py-20">

            <div className="pb-4 mb-14 border-b border-ink/12">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-muted">
                The method
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
              {STEPS.map(({ n, title, body }) => (
                <div key={n} className="space-y-5">
                  <span
                    className="block text-6xl font-bold text-ink/[0.09] font-mono tracking-tighter leading-none tabular-nums select-none"
                    aria-hidden="true"
                  >
                    {n}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-ink tracking-tight">{title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Manifesto ──────────────────────────────────────────── */}
        <section className="border-t border-ink/10">
          <div className="max-w-7xl mx-auto px-6 py-24">

            <div className="pb-4 mb-14 border-b border-ink/12">
              <p className="text-[10px] font-semibold tracking-[0.22em] uppercase text-muted">
                What makes DEN different
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
              <h2 className="text-[clamp(2rem,5vw,3.75rem)] font-bold tracking-tighter leading-[1.0] text-ink">
                Built on outcomes,<br />
                not opinions.
              </h2>
              <div className="space-y-8">
                <p className="text-base text-muted leading-relaxed">
                  Most recommendation engines rank by click-through or affiliate margin.
                  DEN tracks what happens after the decision — returns, revisits, satisfaction
                  signals — and weights every result against your specific profile.
                  One ranked output. No hedging.
                </p>
                <Link
                  href="/electronics"
                  className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent-dark active:-translate-y-[1px] text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-accent/20"
                >
                  Try it now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-ink/10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <DenMark className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted">
              © {new Date().getFullYear()} DEN · Decisions. Engineered. Now.
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted">
            <Link href="/privacy" className="hover:text-ink transition-colors duration-150">
              Privacy
            </Link>
            <Link
              href="/electronics"
              className="text-accent hover:text-accent-dark font-semibold transition-colors duration-150"
            >
              Start Quiz →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
