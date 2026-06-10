/**
 * /beauty — Mikki's Wax Bar booking page
 *
 * London-only: middleware.ts redirects visitors outside 35km of central London.
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

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export default function BeautyPage() {
  const category = getDenCategoryById("beauty")!;

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

      <main className="flex-1 px-6 py-12 max-w-4xl mx-auto w-full space-y-10">

        {/* ── Header ───────────────────────────────────── */}
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <p className="text-[11px] font-semibold tracking-widest text-muted uppercase">Beauty · London</p>
            <span className="text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
              Live
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-ink leading-tight">
            Mikki&apos;s Wax Bar
          </h1>

          <p className="text-sm text-muted leading-relaxed max-w-[50ch]">
            {category.tagline}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <a
              href="tel:02081097007"
              className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors duration-150 font-medium"
            >
              <PhoneIcon className="w-4 h-4" />
              020 8109 7007
            </a>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted">
              <MapPinIcon className="w-4 h-4" />
              London, UK
            </span>
          </div>
        </div>

        {/* ── Treatment grid ───────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold tracking-widest text-muted uppercase mb-4">
            Treatments
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {category.subCategories.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col gap-1.5 bg-paper-soft border border-ink/12 rounded-xl px-4 py-3.5"
              >
                <span className="font-semibold text-ink text-sm">{sub.label}</span>
                <span className="text-xs text-muted leading-relaxed">{sub.description}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Booking embed ─────────────────────────────── */}
        <section id="book">
          <p className="text-[11px] font-semibold tracking-widest text-muted uppercase mb-4">
            Book Online
          </p>
          <PhorestEmbed />
          <p className="text-xs text-muted/50 mt-3">
            Prefer to call?{" "}
            <a href="tel:02081097007" className="text-accent/70 hover:text-accent transition-colors duration-150">
              020 8109 7007
            </a>
          </p>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="px-6 py-6 border-t border-ink/10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted/50">
          <Link href="/" className="hover:text-ink transition-colors duration-150">← DEN Home</Link>
          <span>© {new Date().getFullYear()} DEN · Mikki&apos;s Wax Bar, London</span>
        </div>
      </footer>

    </div>
  );
}
