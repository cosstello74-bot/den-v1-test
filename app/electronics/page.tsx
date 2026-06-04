/**
 * /electronics — Electronics Hub
 *
 * Shows all 6 electronics sub-categories. Each card links to its quiz.
 * Headphones is marked coming soon.
 */

import type React from "react";
import Link from "next/link";
import { getDenCategoryById } from "@/lib/den-categories";

// ─── Icons ─────────────────────────────────────────────────────────────────────

function LaptopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M1 20h22" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function TabletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="9" height="18" rx="1.5" />
      <rect x="13" y="3" width="9" height="8" rx="1.5" />
      <rect x="13" y="13" width="9" height="8" rx="1.5" />
    </svg>
  );
}

function HeadphonesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0118 0v6" />
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    </svg>
  );
}

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
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

// ─── Sub-category icon map ─────────────────────────────────────────────────────

const SUB_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  laptops:    LaptopIcon,
  phones:     PhoneIcon,
  tablets:    TabletIcon,
  monitors:   MonitorIcon,
  pcs:        DesktopIcon,
  headphones: HeadphonesIcon,
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ElectronicsPage() {
  const category = getDenCategoryById("electronics")!;

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
        <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors duration-150 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          All categories
        </Link>
      </nav>

      <main className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">

        {/* ── Category header ───────────────────────────── */}
        <div className="mb-10 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-3">
            <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">Electronics</p>
            <span className="text-[10px] font-bold tracking-wide bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full uppercase">Live</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white leading-tight">
            {category.tagline}
          </h1>
          <p className="text-sm text-gray-500 max-w-[50ch] leading-relaxed">
            Pick your device category, answer a few questions, and get a single ranked recommendation.
          </p>
        </div>

        {/* ── Sub-category grid ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {category.subCategories.map((sub, i) => {
            const Icon      = SUB_ICON_MAP[sub.id] ?? LaptopIcon;
            const isLive    = !sub.comingSoon;

            return isLive ? (
              <Link
                key={sub.id}
                href={sub.href}
                style={{ "--index": i } as React.CSSProperties}
                className="stagger-item group flex flex-col gap-5 bg-gray-900 hover:bg-gray-800/70 border border-gray-800 hover:border-indigo-800/50 rounded-2xl px-5 py-5 transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <Icon className="w-5 h-5 text-indigo-400" />
                  <span className="text-[10px] font-bold tracking-wide bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full uppercase">
                    Live
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors duration-150 text-sm mb-1.5">
                    {sub.label}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{sub.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors duration-150 mt-auto">
                  <span>Start Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                </div>
              </Link>
            ) : (
              <div
                key={sub.id}
                style={{ "--index": i } as React.CSSProperties}
                className="stagger-item flex flex-col gap-5 bg-gray-900/60 border border-gray-800/60 rounded-2xl px-5 py-5 opacity-60"
              >
                <div className="flex items-start justify-between">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-[10px] font-bold tracking-wide bg-gray-800/80 text-gray-600 border border-gray-700/60 px-2 py-0.5 rounded-full uppercase">
                    Soon
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 text-sm mb-1.5">{sub.label}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{sub.description}</p>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700">
          <Link href="/" className="hover:text-gray-400 transition-colors duration-150">← DEN Home</Link>
          <span>© 2025 DEN</span>
        </div>
      </footer>

    </div>
  );
}
