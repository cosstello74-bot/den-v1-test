/**
 * Shared server component template for DEN traffic-seeding landing pages.
 *
 * Renders:
 *   1. Hero — H1, description, intent keyword pills
 *   2. Ranked product list — composite-scored, affiliate links
 *   3. FAQ accordion (optional)
 *   4. Quiz CTA
 */

import Link          from "next/link";
import type { CategoryKey, Product } from "@/types/product";
import type { InternalLink }         from "@/lib/seo/internalLinks";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FaqItem = {
  question: string;
  answer:   string;
};

export type LandingPageMeta = {
  h1:            string;
  intentKeyword: string;
  description:   string;
  category:      CategoryKey;
  keywords:      string[];
  quizHref?:     string;
  relatedLinks?: InternalLink[];
};

type Props = {
  meta:      LandingPageMeta;
  products:  Product[];
  faqItems?: FaqItem[];
  jsonLd?:   string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRICE_BAND_LABEL: Record<string, string> = {
  budget:  "Budget",
  mid:     "Mid-range",
  high:    "High-end",
  premium: "Premium",
};

function compositeScore(p: Product): number {
  return Math.round(
    p.productivity_score * 0.30 +
    p.battery_score      * 0.25 +
    p.value_score        * 0.25 +
    p.gaming_score       * 0.20
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TrafficLandingTemplate({
  meta,
  products,
  faqItems,
  jsonLd,
}: Props) {
  const ranked      = [...products].sort((a, b) => compositeScore(b) - compositeScore(a));
  const quizHref    = meta.quizHref ?? `/quiz?category=${meta.category}`;
  const relatedLinks = meta.relatedLinks ?? [];

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}

      <div className="min-h-screen bg-gray-950 text-white">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
              <span className="text-sm font-semibold text-white">DEN</span>
            </Link>
            <Link
              href={quizHref}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Get my personalised pick →
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-14">

          {/* ── SECTION 1 — Hero ────────────────────────────────────── */}
          <section aria-label="Page introduction" className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
                DEN · Truth-calibrated rankings
              </p>
              <h1 className="text-3xl font-bold tracking-tight">{meta.h1}</h1>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
              {meta.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {meta.keywords.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  className="text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-900/40 px-2.5 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </section>

          {/* ── SECTION 2 — Product list ─────────────────────────────── */}
          <section aria-label="Ranked product list" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">
                Top {ranked.length} Picks
              </h2>
              <p className="text-xs text-gray-500">
                Ranked by truth-calibrated composite score. No sponsored placements.
              </p>
            </div>

            <div className="space-y-3">
              {ranked.map((p, i) => {
                const score = compositeScore(p);
                const isTop = i === 0;
                return (
                  <div
                    key={p.id}
                    className={`bg-gray-900 border rounded-2xl p-5 flex items-center gap-5 ${
                      isTop ? "border-indigo-800/50 shadow-sm shadow-indigo-900/20" : "border-gray-800"
                    }`}
                  >
                    {/* Rank badge */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-indigo-600 text-white" :
                      i === 1 ? "bg-gray-700 text-gray-200" :
                                "bg-gray-800/60 text-gray-500"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-100">{p.name}</span>
                        {isTop && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                            Top Pick
                          </span>
                        )}
                        <span className="text-[11px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">
                          {PRICE_BAND_LABEL[p.price_band] ?? p.price_band}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
                        <span>Battery <span className="text-gray-300 font-semibold">{p.battery_score}</span></span>
                        <span>Productivity <span className="text-gray-300 font-semibold">{p.productivity_score}</span></span>
                        <span>Value <span className="text-gray-300 font-semibold">{p.value_score}</span></span>
                        <span>Gaming <span className="text-gray-300 font-semibold">{p.gaming_score}</span></span>
                      </div>
                    </div>

                    {/* Score + CTA */}
                    <div className="shrink-0 flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-gray-600 uppercase tracking-wide">Score</div>
                        <div className="text-lg font-bold tabular-nums text-indigo-400">{score}</div>
                      </div>
                      <a
                        href={p.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="shrink-0 text-xs font-semibold text-indigo-400 border border-indigo-800/60 bg-indigo-950/30 hover:bg-indigo-900/40 px-3 py-2 rounded-lg transition-colors"
                      >
                        View deal
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── SECTION 3 — FAQ ─────────────────────────────────────── */}
          {faqItems && faqItems.length > 0 && (
            <section aria-label="Frequently Asked Questions" className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight">Common Questions</h2>
              <div className="space-y-3">
                {faqItems.map((faq, i) => (
                  <details
                    key={i}
                    className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                      <span className="text-sm font-medium text-gray-200">{faq.question}</span>
                      <span className="ml-4 shrink-0 text-gray-600 group-open:rotate-180 transition-transform text-xs">▼</span>
                    </summary>
                    <div className="px-5 pb-5 border-t border-gray-800">
                      <p className="text-sm text-gray-400 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ── SECTION 4 — Related links ───────────────────────────── */}
          {relatedLinks.length > 0 && (
            <section aria-label="Related rankings" className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Related Rankings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={link.href}
                    className="group flex flex-col gap-1 bg-gray-900 border border-gray-800 hover:border-indigo-800/50 rounded-xl px-4 py-3.5 transition-all duration-150 hover:-translate-y-0.5"
                  >
                    <span className="text-sm font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors">
                      {link.title}
                    </span>
                    <span className="text-xs text-gray-500">{link.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── SECTION 5 — Quiz CTA ────────────────────────────────── */}
          <section
            aria-label="Get personalised recommendation"
            className="text-center space-y-4 py-6 border-t border-gray-800/50"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Get your exact match</h2>
              <p className="text-sm text-gray-500">
                Answer 6 questions. The intelligence engine scores every option against your use case and budget.
              </p>
            </div>
            <Link
              href={quizHref}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-8 py-3.5 transition-all duration-150 active:scale-[0.98] shadow-lg shadow-indigo-900/30 text-sm"
            >
              Find my best pick
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <footer className="text-center text-xs text-gray-700 pb-4 space-y-1">
            <p>DEN — Decision Intelligence · Rankings updated in real time</p>
            <p>No sponsored placements · No affiliate ranking manipulation</p>
          </footer>

        </main>
      </div>
    </>
  );
}
