/**
 * HubStub — shared layout for coming-soon category hub pages.
 * Server component; no client state needed.
 */

import type React from "react";
import Link from "next/link";
import type { DenTopCategory } from "@/lib/den-categories";

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function HubStub({ category }: { category: DenTopCategory }) {
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
            <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">{category.label}</p>
            <span className="text-[10px] font-bold tracking-wide bg-gray-800/80 text-gray-600 border border-gray-700/60 px-2 py-0.5 rounded-full uppercase">
              Coming Soon
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white leading-tight max-w-[28rem]">
            {category.tagline}
          </h1>
          <p className="text-sm text-gray-600 max-w-[48ch] leading-relaxed">
            Ranked recommendations for {category.label.toLowerCase()} are in development.
            We&apos;ll have scored results ready soon.
          </p>
        </div>

        {/* ── Sub-category placeholders ─────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {category.subCategories.map((sub, i) => (
            <div
              key={sub.id}
              style={{ "--index": i } as React.CSSProperties}
              className="stagger-item flex flex-col gap-4 bg-gray-900/50 border border-gray-800/50 rounded-2xl px-5 py-5 opacity-50"
            >
              <div className="flex items-start justify-between">
                <div className="w-5 h-5 rounded bg-gray-800" />
                <span className="text-[10px] font-bold tracking-wide bg-gray-800/80 text-gray-600 border border-gray-700/60 px-2 py-0.5 rounded-full uppercase">
                  Soon
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-500 text-sm mb-1.5">{sub.label}</p>
                <p className="text-xs text-gray-700 leading-relaxed">{sub.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Back CTA ──────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-gray-800/50">
          <p className="text-sm text-gray-600 mb-4">
            While we build out {category.label}, the Electronics quiz is live now.
          </p>
          <Link
            href="/electronics"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:-translate-y-[1px] text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all duration-150"
          >
            Try Electronics Quiz
          </Link>
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
