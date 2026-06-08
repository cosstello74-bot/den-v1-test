import type { Metadata }      from "next";
import Link                     from "next/link";
import { notFound }             from "next/navigation";
import { getCategoryConfig }    from "@/lib/category";
import { filterProductsForPage, enrichPage } from "@/lib/ael/enrichmentPipeline";
import type { GeneratedPageConfig } from "@/lib/ael/pageGenerator";
import type { CategoryKey }     from "@/types/product";
import type { InternalLink }    from "@/lib/seo/internalLinks";
import { resolveAffiliateUrl }  from "@/lib/v4/affiliateResolver";
import GeoSignalTracker         from "@/components/geo/GeoSignalTracker";
import PageTracker              from "@/components/v2/PageTracker";
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

// Category-aware score dimension labels.
// All categories share the same 5 underlying score fields but the
// meaning of each differs — e.g. gaming_score means "refresh rate"
// for monitors, "camera quality" for phones.
type ScoreDim = {
  label: string;
  key:   "battery_score" | "portability_score" | "gaming_score" | "productivity_score" | "value_score";
};

const CATEGORY_DIMS: Record<string, ScoreDim[]> = {
  laptops: [
    { label: "Battery",     key: "battery_score"      },
    { label: "Portable",    key: "portability_score"  },
    { label: "Gaming",      key: "gaming_score"       },
    { label: "Productive",  key: "productivity_score" },
    { label: "Value",       key: "value_score"        },
  ],
  phones: [
    { label: "Battery",     key: "battery_score"      },
    { label: "Compact",     key: "portability_score"  },
    { label: "Performance", key: "gaming_score"       },
    { label: "Camera",      key: "productivity_score" },
    { label: "Value",       key: "value_score"        },
  ],
  monitors: [
    { label: "Refresh",     key: "gaming_score"       },
    { label: "Colour",      key: "productivity_score" },
    { label: "Build",       key: "battery_score"      },
    { label: "Size",        key: "portability_score"  },
    { label: "Value",       key: "value_score"        },
  ],
  tablets: [
    { label: "Battery",     key: "battery_score"      },
    { label: "Portable",    key: "portability_score"  },
    { label: "Performance", key: "gaming_score"       },
    { label: "Productive",  key: "productivity_score" },
    { label: "Value",       key: "value_score"        },
  ],
  pcs: [
    { label: "Gaming",      key: "gaming_score"       },
    { label: "Processing",  key: "productivity_score" },
    { label: "Efficiency",  key: "battery_score"      },
    { label: "Design",      key: "portability_score"  },
    { label: "Value",       key: "value_score"        },
  ],
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
  const dims       = CATEGORY_DIMS[page.category] ?? CATEGORY_DIMS.laptops;

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
      <PageTracker slug={params.slug} />

      {/* ── JSON-LD structured data ─────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: enrichment.jsonLd }}
      />

      <GeoSignalTracker category={page.slug} />

      <div className="min-h-screen bg-paper text-ink">

        {/* ── Nav ───────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-20 backdrop-blur-sm bg-paper/90 border-b border-ink/10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" aria-label="DEN home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="DEN" className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-3 text-xs">
              <Link href={`/${page.category}`} className="text-muted hover:text-ink transition-colors capitalize">
                {page.category} →
              </Link>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                {enrichment.geoGrade} Match
              </span>
            </div>
          </div>
        </nav>

        {/* ── Breadcrumb ────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-6 pt-4 pb-0">
          <ol className="flex items-center gap-1.5 text-xs text-muted">
            <li><Link href="/" className="hover:text-ink transition-colors">Home</Link></li>
            <li aria-hidden="true" className="select-none">›</li>
            <li>
              <Link href={`/${page.category}`} className="hover:text-ink transition-colors capitalize">
                {page.category}
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">›</li>
            <li className="text-ink/50 truncate max-w-[200px]">{page.h1}</li>
          </ol>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-14">

          {/* ── Header ────────────────────────────────────────────── */}
          <section aria-label="Page summary" className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-widest text-accent">
                  Decision Intelligence · {page.category.charAt(0).toUpperCase() + page.category.slice(1)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent">
                  {page.category.charAt(0).toUpperCase() + page.category.slice(1)} · Ranked
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{page.h1}</h1>
            </div>

            <div className="bg-paper-soft border border-ink/12 rounded-2xl p-5 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Summary</p>
              <p className="text-sm text-ink/80 leading-relaxed">{enrichment.summary}</p>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-ink/12 text-xs">
                <div>
                  <dt className="text-muted uppercase tracking-widest text-[10px]">Products</dt>
                  <dd className="font-bold text-base tabular-nums mt-0.5">{sortedProducts.length}</dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-widest text-[10px]">Intent</dt>
                  <dd className="font-semibold text-accent mt-0.5">{page.intent.replace(/_/g, " ")}</dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-widest text-[10px]">GEO Score</dt>
                  <dd className={`font-bold mt-0.5 ${enrichment.geoGrade === "A" ? "text-emerald-600" : enrichment.geoGrade === "B" ? "text-accent" : "text-amber-600"}`}>
                    {enrichment.geoScore} / {enrichment.geoGrade}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-widest text-[10px]">AEL Confidence</dt>
                  <dd className="font-bold text-accent mt-0.5">{(page.confidence * 100).toFixed(0)}%</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ── Ranked product list ────────────────────────────────── */}
          <section aria-label="Ranked products" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Ranked Picks</h2>
              <p className="text-xs text-muted">
                Scored for <strong className="text-ink/70">{page.intent.replace(/_/g, " ")}</strong> intent using truth-calibrated, composite weighting.
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
                        ? "border-accent/30 bg-accent/5"
                        : "border-ink/12 bg-paper-soft hover:border-ink/25"
                    } transition-colors`}
                  >

                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isBest ? "text-accent" : "text-muted"}`}>
                          {i === 0 ? "Best Match" : i === 1 ? "Runner Up" : `Option ${i + 1}`}
                        </span>
                        <h3 className={`font-bold tracking-tight ${isBest ? "text-xl text-ink" : "text-lg text-ink"}`}>
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted">{product.brand}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-[11px] font-semibold text-muted bg-ink/8 px-2.5 py-1 rounded-full border border-ink/12">
                          {PRICE_BAND_LABEL[product.price_band] ?? product.price_band}
                        </span>
                        <span className="text-[11px] font-bold text-accent tabular-nums">
                          Intent score: {intentScore}
                        </span>
                      </div>
                    </div>

                    {/* Dimension bars */}
                    <div className="grid grid-cols-5 gap-2">
                      {dims.map(({ label, key }) => {
                        const val    = product[key];
                        const weight = w[key as keyof typeof w] ?? 0;
                        return (
                          <div key={label} className="text-center space-y-1">
                            <div className={`h-10 rounded-lg overflow-hidden flex flex-col-reverse ${weight > 0.2 ? "bg-accent/10" : "bg-ink/8"}`}>
                              <div
                                className={`w-full rounded-b-lg ${weight > 0.2 ? "bg-accent/40" : "bg-ink/15"}`}
                                style={{ height: `${val}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-muted font-medium leading-tight">{label}</p>
                          </div>
                        );
                      })}
                    </div>

                    <a
                      href={resolveAffiliateUrl(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-center gap-2 w-full font-semibold rounded-xl px-5 py-3 text-sm transition-all duration-150 active:scale-[0.98] ${
                        isBest
                          ? "bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/20"
                          : "bg-ink/8 hover:bg-ink/15 text-ink"
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
                <details key={i} className="group bg-paper-soft border border-ink/12 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
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

          {/* ── Entity keywords ───────────────────────────────────── */}
          <section aria-label="Entity index" className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Related</p>
            <div className="flex flex-wrap gap-2">
              {enrichment.keywords.map((kw) => (
                <span key={kw} className="text-xs text-muted bg-paper-soft border border-ink/12 px-3 py-1 rounded-full">
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

          {/* ── CTA ───────────────────────────────────────────────── */}
          <section className="text-center space-y-4 py-6 border-t border-ink/10">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Get a personalised recommendation</h2>
              <p className="text-sm text-muted">Answer 6 questions and get a match scored exactly for your profile.</p>
            </div>
            <Link
              href={quizHref}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl px-8 py-3.5 transition-all duration-150 text-sm shadow-lg shadow-accent/20"
            >
              Start the quiz
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          <footer className="text-center text-xs text-muted/50 pb-4 space-y-1">
            <p>DEN AEL — Autonomously generated page · Confidence {(page.confidence * 100).toFixed(0)}%</p>
            <p>No sponsored placements · Rankings driven by truth-calibrated intelligence</p>
          </footer>

        </main>
      </div>
    </>
  );
}
