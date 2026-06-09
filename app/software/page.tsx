import type React from "react";
import Link from "next/link";
import { getDenCategoryById } from "@/lib/den-categories";

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 010 20M2 12h20" />
      <path d="M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10M12 2c-2.5 2.5-4 6-4 10s1.5 7.5 4 10" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
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

const SUB_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  os:               MonitorIcon,
  office:           GridIcon,
  security:         ShieldIcon,
  vpn:              GlobeIcon,
  "software-bundles": TagIcon,
};

export default function SoftwarePage() {
  const category = getDenCategoryById("software")!;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper text-ink">

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-20 backdrop-blur-sm bg-paper/90 border-b border-ink/10 flex items-center justify-between px-6 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="DEN" className="h-9 w-auto" />
        <Link href="/" className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors duration-150 font-medium py-2 px-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          All categories
        </Link>
      </nav>

      <main className="flex-1 px-6 py-12 max-w-7xl mx-auto w-full">

        {/* ── Category header ───────────────────────────── */}
        <div className="mb-10 space-y-2 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-3">
            <p className="text-[11px] font-semibold tracking-widest text-muted uppercase">Software</p>
            <span className="text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">Live</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-ink leading-tight">
            {category.tagline}
          </h1>
          <p className="text-sm text-muted max-w-[50ch] leading-relaxed">
            Answer four questions and get a single ranked licence recommendation. All products via Mr Key Shop — typically 70–90% below retail.
          </p>
        </div>

        {/* ── Sub-category grid ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {category.subCategories.map((sub, i) => {
            const Icon   = SUB_ICON_MAP[sub.id] ?? MonitorIcon;
            const isLive = !sub.comingSoon;

            return isLive ? (
              <Link
                key={sub.id}
                href={sub.href}
                style={{ "--index": i } as React.CSSProperties}
                className="stagger-item group flex flex-col gap-5 bg-paper-soft hover:bg-[#ddd6c4] border border-ink/12 hover:border-accent/40 rounded-2xl px-5 py-5 transition-all duration-150 hover:-translate-y-[1px] cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <Icon className="w-5 h-5 text-accent" />
                  <span className="text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                    Live
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-ink group-hover:text-accent transition-colors duration-150 text-sm mb-1.5">
                    {sub.label}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">{sub.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors duration-150 mt-auto">
                  <span>Start Quiz</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
                </div>
              </Link>
            ) : (
              <div
                key={sub.id}
                style={{ "--index": i } as React.CSSProperties}
                className="stagger-item flex flex-col gap-5 bg-paper-soft/60 border border-ink/8 rounded-2xl px-5 py-5 opacity-60"
              >
                <div className="flex items-start justify-between">
                  <Icon className="w-5 h-5 text-muted/50" />
                  <span className="text-[10px] font-bold tracking-wide bg-ink/8 text-muted border border-ink/10 px-2 py-0.5 rounded-full uppercase">
                    Soon
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-muted text-sm mb-1.5">{sub.label}</p>
                  <p className="text-xs text-muted/60 leading-relaxed">{sub.description}</p>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-ink/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted/50">
          <Link href="/" className="hover:text-ink transition-colors duration-150">← DEN Home</Link>
          <span>© {new Date().getFullYear()} DEN</span>
        </div>
      </footer>

    </div>
  );
}
