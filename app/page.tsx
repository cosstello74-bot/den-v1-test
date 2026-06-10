/**
 * DEN Homepage — Server Component (bento redesign)
 */

import type React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getPublicCategories } from "@/lib/den-categories";
import type { DenTopCategory } from "@/lib/den-categories";
import { isLondonVisitor } from "@/lib/geo/londonDetect";

// ─── Decorative logo mark ─────────────────────────────────────────────────────

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

// ─── Category icons ───────────────────────────────────────────────────────────

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
      <path d="M12 3c-2 3.5-4.5 6.5-4.5 9.5a4.5 4.5 0 009 0C16.5 9.5 14 6.5 12 3z" />
      <path d="M10.5 17a2.5 2.5 0 003 0" />
    </svg>
  );
}

function SoftwareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

// ─── Icon map ─────────────────────────────────────────────────────────────────

const CAT_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  electronics: ElectronicsIcon,
  finance:     FinanceIcon,
  home:        HomeIcon,
  health:      HealthIcon,
  travel:      TravelIcon,
  software:    SoftwareIcon,
  business:    BusinessIcon,
  beauty:      BeautyIcon,
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ cat }: { cat: DenTopCategory }) {
  const hasLiveSub = cat.subCategories.some((s) => !s.comingSoon);
  if (hasLiveSub) {
    return (
      <span className="text-[9px] font-bold tracking-widest uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
        Live
      </span>
    );
  }
  if (cat.locationBadge) {
    return (
      <span className="text-[9px] font-medium text-accent border border-accent/40 px-2 py-0.5 rounded-full">
        {cat.locationBadge}
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold tracking-widest uppercase bg-paper/10 text-paper/40 border border-paper/20 px-2 py-0.5 rounded-full">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const headersList = headers();
  const isLondon    = isLondonVisitor(
    headersList.get("x-vercel-ip-latitude"),
    headersList.get("x-vercel-ip-longitude"),
    headersList.get("x-vercel-ip-city"),
  );
  const categories  = getPublicCategories(isLondon);


  return (
    <div className="min-h-[100dvh] flex flex-col">

      {/* ── Nav ── always dark, sticky ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 bg-ink backdrop-blur-md border-b border-paper/8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" aria-label="DEN home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="DEN — Decision Intelligence" className="h-10 sm:h-12 w-auto" />
          </Link>
          <Link
            href="/electronics"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark active:scale-[0.97] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer"
          >
            Start now
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── dark, full-bleed ──────────────────────────────────────── */}
      <section className="relative bg-ink text-paper overflow-hidden">
        {/* Ambient glow blobs */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full bg-accent/10 blur-[140px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-accent/6 blur-[100px] pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-20 md:pt-28 md:pb-36">

          {/* Eyebrow */}
          <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-accent mb-8 animate-fade-in">
            Decision Intelligence · United Kingdom
          </p>

          {/* Display headline — massive */}
          <h1 className="text-[clamp(3.2rem,12vw,9.5rem)] font-bold tracking-tighter leading-[0.87] text-paper animate-slide-up">
            Stop<br />
            scrolling.<br />
            <span className="text-accent">Get your</span><br />
            match.
          </h1>

          {/* Sub-copy + CTA */}
          <div className="mt-12 md:mt-20 pt-8 border-t border-paper/10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-24 items-center animate-slide-up delay-150">
            <p className="text-base md:text-lg text-paper/55 leading-relaxed max-w-[46ch]">
              Answer 6 questions about use case, budget, and priorities.
              We rank against real purchase outcomes — not what paid the highest commission.
            </p>
            <div className="flex flex-col gap-3 items-start md:items-end shrink-0">
              <Link
                href="/electronics"
                className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent-dark active:scale-[0.97] text-white font-bold px-8 py-4 rounded-xl transition-all duration-150 text-sm shadow-2xl shadow-accent/20 cursor-pointer"
              >
                Find My Match
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-paper/30 font-medium">
                Free · No account · 60 seconds
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BELT ── terracotta ──────────────────────────────────────── */}
      <div className="bg-accent overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex divide-x divide-white/20 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {[
              { n: "6",  label: "Questions to your match" },
              { n: "0",  label: "Sponsored results, ever" },
              { n: "1",  label: "Ranked answer — no hedging" },
            ].map(({ n, label }) => (
              <div key={label} className="flex-1 min-w-[130px] px-6 sm:px-10 py-7 flex flex-col gap-1.5">
                <span className="text-[2.5rem] sm:text-5xl font-bold text-white tabular-nums leading-none">{n}</span>
                <span className="text-[9px] sm:text-[10px] text-paper uppercase tracking-widest font-semibold leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CATEGORIES ── cream bg ────────────────────────────────────────── */}
      <section className="bg-paper">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 md:py-20">

          {/* Section header */}
          <div className="mb-8 md:mb-10">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-accent mb-2">
              Where do you need a match?
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
              Choose your vertical
            </h2>
          </div>

          {/* All categories — equal dark cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat) => {
              const Icon = CAT_ICON_MAP[cat.id] ?? ElectronicsIcon;
              return (
                <Link key={cat.id} href={cat.href} className="group block cursor-pointer">
                  <div className="relative h-full bg-ink text-paper rounded-2xl p-5 md:p-6 overflow-hidden transition-all duration-200 group-hover:ring-2 ring-accent/35 active:scale-[0.98]">
                    <div
                      className="absolute -top-8 -right-8 w-44 h-44 bg-accent/8 rounded-full blur-[70px] pointer-events-none"
                      aria-hidden="true"
                    />
                    <div className="relative flex flex-col gap-3 h-full min-h-[200px]">

                      {/* icon + badge */}
                      <div className="flex items-start justify-between">
                        <div className="w-9 h-9 rounded-xl bg-paper/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-accent" />
                        </div>
                        <StatusBadge cat={cat} />
                      </div>

                      {/* label + tagline */}
                      <div className="flex-1">
                        <h3 className="font-bold text-paper tracking-tight group-hover:text-accent transition-colors duration-150 leading-tight">
                          {cat.label}
                        </h3>
                        <p className="text-xs text-paper/45 mt-1.5 leading-relaxed line-clamp-2">
                          {cat.tagline}
                        </p>
                      </div>

                      {/* sub-category pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {cat.subCategories.slice(0, 3).map((sub) => (
                          <span
                            key={sub.id}
                            className={`text-[10px] font-medium px-2.5 py-1 rounded-full border ${
                              sub.comingSoon
                                ? "bg-paper/5 text-paper/25 border-paper/10"
                                : "bg-paper/10 text-paper/70 border-paper/20"
                            }`}
                          >
                            {sub.label}
                          </span>
                        ))}
                        {cat.subCategories.length > 3 && (
                          <span className="text-[10px] text-paper/30 self-center">
                            +{cat.subCategories.length - 3}
                          </span>
                        )}
                      </div>

                      {/* explore */}
                      <div className="flex items-center gap-1.5 text-paper/35 group-hover:text-accent transition-colors duration-200 text-xs font-semibold">
                        <span>Explore rankings</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-150" />
                      </div>

                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── METHOD ── deeper cream ────────────────────────────────────────── */}
      <section className="bg-paper-soft border-t border-ink/8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 md:py-24">

          <div className="mb-12 md:mb-16">
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-accent mb-2">
              How it works
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight">
              The intelligence engine
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="space-y-4">
                <span
                  className="block text-[5rem] font-bold text-ink/[0.07] font-mono tracking-tighter leading-none tabular-nums select-none"
                  aria-hidden="true"
                >
                  {n}
                </span>
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-ink tracking-tight">{title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO + CTA ── dark closing ──────────────────────────────── */}
      <section className="bg-ink text-paper relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_80%,#B97A6B12_0%,transparent_55%)] pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-28 items-end">
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-accent mb-6">
                What makes DEN different
              </p>
              <h2 className="text-3xl md:text-[clamp(2.4rem,5vw,4.2rem)] font-bold tracking-tighter leading-[1.0] text-paper">
                Built on outcomes,<br />not opinions.
              </h2>
            </div>
            <div className="space-y-8">
              <p className="text-base text-paper/50 leading-relaxed">
                Most recommendation engines rank by click-through or affiliate margin.
                DEN tracks what happens after the decision — returns, revisits, satisfaction
                signals — and weights every result against your specific profile.
                One ranked output. No hedging.
              </p>
              <Link
                href="/electronics"
                className="inline-flex items-center gap-2.5 bg-accent hover:bg-accent-dark active:scale-[0.97] text-white font-bold px-7 py-4 rounded-xl transition-all duration-150 text-sm shadow-2xl shadow-accent/20 cursor-pointer"
              >
                Try it now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── bg-ink continuation ────────────────────────────────── */}
      <footer className="bg-ink border-t border-paper/8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="DEN" className="h-6 w-auto opacity-60" />
            <span className="text-xs text-paper/30">
              © {new Date().getFullYear()} DEN · Decision Intelligence
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-paper/35">
            <Link href="/privacy" className="hover:text-paper/75 transition-colors duration-150">
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
