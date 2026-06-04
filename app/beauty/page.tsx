/**
 * /beauty — Mikki's Wax Bar booking page
 *
 * UK-only (middleware.ts redirects non-GB visitors to /).
 * Server component — Phorest iframe is isolated in PhorestEmbed (client).
 */

import Link from "next/link";
import { getDenCategoryById } from "@/lib/den-categories";
import PhorestEmbed from "@/components/beauty/PhorestEmbed";

function ArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015 12.84a19.79 19.79 0 01-3-8.67A2 2 0 013.92 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

export default function BeautyPage() {
  const category = getDenCategoryById("beauty")!;

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

      <main className="flex-1 px-6 py-12 max-w-5xl mx-auto w-full space-y-10">

        {/* ── Header ───────────────────────────────────── */}
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase">Beauty · London</p>
            <span className="text-[10px] font-bold tracking-wide bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full uppercase">Live</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white leading-tight">
            Mikki&apos;s Wax Bar
          </h1>

          <p className="text-sm text-gray-500 leading-relaxed max-w-[50ch]">
            {category.tagline}
          </p>

          {/* Phone number */}
          <a
            href="tel:02081097007"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-150 font-medium"
          >
            <PhoneIcon className="w-4 h-4" />
            020 8109 7007
          </a>
        </div>

        {/* ── Treatment list ───────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase mb-4">
            Treatments
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {category.subCategories.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col gap-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5"
              >
                <span className="font-semibold text-white text-sm">{sub.label}</span>
                <span className="text-xs text-gray-500 leading-relaxed">{sub.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Booking embed ─────────────────────────────── */}
        <section id="book">
          <p className="text-[11px] font-semibold tracking-widest text-gray-600 uppercase mb-4">
            Book Online
          </p>
          <PhorestEmbed />
          <p className="text-xs text-gray-700 mt-3">
            Prefer to call?{" "}
            <a href="tel:02081097007" className="text-indigo-400/70 hover:text-indigo-400 transition-colors duration-150">
              020 8109 7007
            </a>
          </p>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700">
          <Link href="/" className="hover:text-gray-400 transition-colors duration-150">← DEN Home</Link>
          <span>© 2025 DEN · Mikki&apos;s Wax Bar, London</span>
        </div>
      </footer>

    </div>
  );
}
