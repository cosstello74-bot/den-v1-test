import type { Metadata }      from "next";
import Link                     from "next/link";
import { notFound }             from "next/navigation";
import { getCategoryConfig }    from "@/lib/category";
import { filterProductsForPage, enrichPage } from "@/lib/ael/enrichmentPipeline";
import type { GeneratedPageConfig } from "@/lib/ael/pageGenerator";
import type { CategoryKey }     from "@/types/product";
import type { InternalLink }    from "@/lib/seo/internalLinks";
import GeoSignalTracker         from "@/components/geo/GeoSignalTracker";
import generatedPagesData       from "@/data/ael/generated-pages.json";
import linkMapData              from "@/data/ael/link-map.json";

type LinkEntry = { quizHref: string; related: InternalLink[] };
const LINK_MAP = linkMapData as Record<string, LinkEntry>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPageConfig(slug: string): GeneratedPageConfig | undefined {
  return (generatedPagesData.pages as GeneratedPageConfig[]).find((p) => p.slug === slug);
}

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return (generatedPagesData.pages as GeneratedPageConfig[]).map((p) => ({ slug: p.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = getPageConfig(params.slug);
  if (!page) return {};

  const config  = getCategoryConfig(page.category);
  const products = filterProductsForPage(config.products, page);
  const enrich   = enrichPage(page, config.products);

  return {
    title:       `${page.title} — DEN`,
    description: page.description,
    keywords:    enrich.keywords,
    openGraph: {
      title:       page.title,
      description: page.description,
      type:        "website",
    },
    other: {
      "ai-indexing":         "enabled",
      "geo-entity-rich":     "true",
      "content-type":        "decision-intelligence",
      "ael-generated":       "true",
      "intent":              page.intent,
      "confidence":          String(page.confidence),
    },
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PRICE_BAND_LABEL: Record<string, string> = {
  budget:  "Budget",
  mid:     "Mid-range",
  high:    "High-end",
  premium: "Premium",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeneratedLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const page = getPageConfig(params.slug);
  if (!page) notFound();

  const config     = getCategoryConfig(page.category);
  const products   = filterProductsForPage(config.products, page);
  const enrichment = enrichPage(page, config.products);

  // v4: intent-prefilled quiz href + related links from link map
  const linkEntry  = LINK_MAP[page.slug];
  const quizHref   = linkEntry?.quizHref ?? `/quiz?category=${page.category}`;
  const related    = (linkEntry?.related ?? []) as InternalLink[];

  // Sort products by intent-weighted composite score for display
  const w = page.intentWeights;
  const sortedProducts = [...products].sort((a, b) => {
    const score = (p: typeof a) =>
      (p.gaming_score       * (w.gaming_score       ?? 0)) +
      (p.productivity_score * (w.productivity_score ?? 0)) +
      (p.battery_score      * (w.battery_score      ?? 0)) +
      (p.portability_score  * (w.portability_score  ?? 0)) +
      (p.value_score        * (w.value_score        ?? 0));
    return score(b) - score(a);
  });

  return (
    <>
      {/* ── JSON-LD structured data ─────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: enrichment.jsonLd }}
      />

      <GeoSignalTracker category={page.slug} />

      <div className="min-h-screen bg-gray-950 text-white">

        {/* ── Nav ───────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
              <span className="text-sm font-semibold text-white">DEN</span>
            </Link>
            <div className="flex items-center gap-3 text-xs">
              <Link href={`/${page.category}`} className="text-gray-500 hover:text-gray-300 transition-colors capitalize">
                {page.category} →
              </Link>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950/50 border border-violet-800/40 text-violet-400">
                GEO {enrichment.geoScore} · {enrichment.geoGrade}
              </span>
              <span className="text-[10px] text-gray-700 font-mono">
                AEL · {(page.confidence * 100).toFixed(0)}% conf
              </span>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-14">

          {/* ── Header ────────────────────────────────────────────── */}
          <section aria-label="Page summary" className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
                  Decision Intelligence · {page.category.charAt(0).toUpperCase() + page.category.slice(1)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-950/40 border border-violet-800/30 text-violet-500">
                  Auto-generated · {page.intent.replace(/_/g, " ")}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{page.h1}</h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Machine Summary</p>
              <p className="text-sm text-gray-300 leading-relaxed">{enrichment.summary}</p>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-800 text-xs">
                <div>
                  <dt className="text-gray-600 uppercase tracking-widest text-[10px]">Products</dt>
                  <dd className="font-bold text-base tabular-nums mt-0.5">{sortedProducts.length}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 uppercase tracking-widest text-[10px]">Intent</dt>
                  <dd className="font-semibold text-indigo-400 mt-0.5">{page.intent.replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt className="text-gray-600 uppercase tracking-widest text-[10px]">GEO Score</dt>
                  <dd className={`font-bold mt-0.5 ${enrichment.geoGrade === "A" ? "text-emerald-400" : enrichment.geoGrade === "B" ? "text-indigo-400" : "text-amber-400"}`}>
                    {enrichment.geoScore} / {enrichment.geoGrade}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600 uppercase tracking-widest text-[10px]">AEL Confidence</dt>
                  <dd className="font-bold text-violet-400 mt-0.5">{(page.confidence * 100).toFixed(0)}%</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ── Ranked product list ────────────────────────────────── */}
          <section aria-label="Ranked products" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Ranked Picks</h2>
              <p className="text-xs text-gray-500">
                Scored for <strong className="text-gray-400">{page.intent.replace(/_/g, " ")}</strong> intent using truth-calibrated, composite weighting.
              </p>
            </div>

            <div className="space-y-3">
              {sortedProducts.map((product, i) => {
                const intentScore = Math.round(
                  (product.gaming_score       * (w.gaming_score       ?? 0)) +
                  (product.productivity_score * (w.productivity_score ?? 0)) +
                  (product.battery_score      * (w.battery_score      ?? 0)) +
                  (product.portability_score  * (w.portability_score  ?? 0)) +
                  (product.value_score        * (w.value_score        ?? 0))
                );
                const isBest = i === 0;

                return (
                  <div
                    key={product.id}
                    id={product.id}
                    className={`rounded-2xl border p-5 space-y-4 ${
                      isBest
                        ? "border-indigo-500/60 bg-gradient-to-b from-indigo-950/20 to-gray-900"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    } transition-colors`}
                  >
                    {isBest && <div className="h-0.5 -mx-5 -mt-5 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 rounded-t-2xl" />}

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isBest ? "text-indigo-400" : "text-gray-600"}`}>
                          {i === 0 ? "Best Match" : i === 1 ? "Runner Up" : `Option ${i + 1}`}
                        </span>
                        <h3 className={`font-bold tracking-tight ${isBest ? "text-xl text-white" : "text-lg text-gray-100"}`}>
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-600">{product.brand}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
                          {PRICE_BAND_LABEL[product.price_band] ?? product.price_band}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-400 tabular-nums">
                          Intent score: {intentScore}
                        </span>
                      </div>
                    </div>

                    {/* Dimension bars */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: "Battery",     val: product.battery_score,      weight: w.battery_score      ?? 0 },
                        { label: "Portable",    val: product.portability_score,  weight: w.portability_score  ?? 0 },
                        { label: "Gaming",      val: product.gaming_score,       weight: w.gaming_score       ?? 0 },
                        { label: "Productive",  val: product.productivity_score, weight: w.productivity_score ?? 0 },
                        { label: "Value",       val: product.value_score,        weight: w.value_score        ?? 0 },
                      ].map(({ label, val, weight }) => (
                        <div key={label} className="text-center space-y-1">
                          <div className={`h-10 rounded-lg overflow-hidden flex flex-col-reverse ${weight > 0.2 ? "bg-indigo-950/40" : "bg-gray-800"}`}>
                            <div
                              className={`w-full rounded-b-lg ${weight > 0.2 ? "bg-indigo-500/60" : "bg-gray-700"}`}
                              style={{ height: `${val}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-gray-600 font-medium leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>

                    <a
                      href={product.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full font-semibold rounded-xl px-5 py-3 text-sm transition-all duration-150 active:scale-[0.98] ${
                        isBest
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                      }`}
                    >
                      Check Current Price
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── FAQ Block ──────────────────────────────────────────── */}
          <section aria-label="Frequently asked questions" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Common Questions</h2>
            <div className="space-y-2">
              {enrichment.faqBlocks.map((faq, i) => (
                <details key={i} className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
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

          {/* ── Entity keywords ───────────────────────────────────── */}
          <section aria-label="Entity index" className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Related</p>
            <div className="flex flex-wrap gap-2">
              {enrichment.keywords.map((kw) => (
                <span key={kw} className="text-xs text-gray-500 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          </section>

          {/* ── Related rankings (v4 link expansion) ──────────────── */}
          {related.length > 0 && (
            <section aria-label="Related rankings" className="space-y-4">
              <h2 className="text-lg font-bold tracking-tight">Related Rankings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((link) => (
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

          {/* ── CTA ───────────────────────────────────────────────── */}
          <section className="text-center space-y-4 py-6 border-t border-gray-800/50">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Get a personalised recommendation</h2>
              <p className="text-sm text-gray-500">Answer 6 questions and get a match scored exactly for your profile.</p>
            </div>
            <Link
              href={quizHref}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-8 py-3.5 transition-all duration-150 text-sm shadow-lg shadow-indigo-900/30"
            >
              Start the quiz
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          <footer className="text-center text-xs text-gray-700 pb-4 space-y-1">
            <p>DEN AEL — Autonomously generated page · Confidence {(page.confidence * 100).toFixed(0)}%</p>
            <p>No sponsored placements · Rankings driven by truth-calibrated intelligence</p>
          </footer>

        </main>
      </div>
    </>
  );
}
