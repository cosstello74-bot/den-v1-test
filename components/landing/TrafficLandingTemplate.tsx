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

      <div className="min-h-screen bg-paper text-ink">

        {/* ── Nav ─────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-20 backdrop-blur-sm bg-paper/90 border-b border-ink/10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-xs font-bold text-white">D</span>
              <span className="text-sm font-semibold text-ink">DEN</span>
            </Link>
            <Link
              href={quizHref}
              className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors"
            >
              Get my personalised pick →
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-14">

          {/* ── SECTION 1 — Hero ────────────────────────────────────── */}
          <section aria-label="Page introduction" className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                DEN · Truth-calibrated rankings
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-ink">{meta.h1}</h1>
            </div>
            <p className="text-sm text-muted leading-relaxed max-w-2xl">
              {meta.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {meta.keywords.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  className="text-[11px] text-accent bg-accent/10 border border-accent/30 px-2.5 py-1 rounded-full"
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
              <p className="text-xs text-muted">
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
                    className={`bg-paper-soft border rounded-2xl p-5 flex items-center gap-5 ${
                      isTop ? "border-accent/30 shadow-sm shadow-accent/10" : "border-ink/12"
                    }`}
                  >
                    {/* Rank badge */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                      i === 0 ? "bg-accent text-white" :
                      i === 1 ? "bg-ink/15 text-ink" :
                                "bg-ink/8 text-muted"
                    }`}>
                      {i + 1}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-ink">{p.name}</span>
                        {isTop && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                            Top Pick
                          </span>
                        )}
                        <span className="text-[11px] text-muted bg-ink/8 px-2 py-0.5 rounded">
                          {PRICE_BAND_LABEL[p.price_band] ?? p.price_band}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[11px] text-muted">
                        <span>Battery <span className="text-ink font-semibold">{p.battery_score}</span></span>
                        <span>Productivity <span className="text-ink font-semibold">{p.productivity_score}</span></span>
                        <span>Value <span className="text-ink font-semibold">{p.value_score}</span></span>
                        <span>Gaming <span className="text-ink font-semibold">{p.gaming_score}</span></span>
                      </div>
                    </div>

                    {/* Score + CTA */}
                    <div className="shrink-0 flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-muted uppercase tracking-wide">Score</div>
                        <div className="text-lg font-bold tabular-nums text-accent">{score}</div>
                      </div>
                      <a
                        href={p.affiliate_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="shrink-0 text-xs font-semibold text-accent border border-accent/40 bg-accent/8 hover:bg-accent/15 px-3 py-2 rounded-lg transition-colors"
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
                    className="group bg-paper-soft border border-ink/12 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none select-none">
                      <span className="text-sm font-medium text-ink">{faq.question}</span>
                      <span className="ml-4 shrink-0 text-muted group-open:rotate-180 transition-transform text-xs">▼</span>
                    </summary>
                    <div className="px-5 pb-5 border-t border-ink/10">
                      <p className="text-sm text-muted leading-relaxed pt-4">{faq.answer}</p>
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
                    className="group flex flex-col gap-1 bg-paper-soft border border-ink/12 hover:border-accent/40 rounded-xl px-4 py-3.5 transition-all duration-150 hover:-translate-y-0.5"
                  >
                    <span className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">
                      {link.title}
                    </span>
                    <span className="text-xs text-muted">{link.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── SECTION 5 — Quiz CTA ────────────────────────────────── */}
          <section
            aria-label="Get personalised recommendation"
            className="text-center space-y-4 py-6 border-t border-ink/10"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-ink">Get your exact match</h2>
              <p className="text-sm text-muted">
                Answer 6 questions. The intelligence engine scores every option against your use case and budget.
              </p>
            </div>
            <Link
              href={quizHref}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl px-8 py-3.5 transition-all duration-150 active:scale-[0.98] shadow-lg shadow-accent/20 text-sm"
            >
              Find my best pick
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <footer className="text-center text-xs text-muted pb-4 space-y-1">
            <p>DEN — Decision Intelligence · Rankings updated in real time</p>
            <p>No sponsored placements · No affiliate ranking manipulation</p>
          </footer>

        </main>
      </div>
    </>
  );
}
