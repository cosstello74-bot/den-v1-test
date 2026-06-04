import type { Metadata }     from "next";
import Link                    from "next/link";
import { notFound }            from "next/navigation";
import { getCategoryConfig, CATEGORY_META, getAllCategories, isValidCategory } from "@/lib/category";
import { generateGeoContent }  from "@/lib/geo/geoContentEngine";
import { extractEntities, extractEntityLabels } from "@/lib/geo/entityExtractor";
import {
  generateItemListSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  serializeSchemas,
} from "@/lib/geo/schemaGenerator";
import { evaluatePageGeoScore } from "@/lib/geo/geoScore";
import type { CategoryKey }     from "@/types/product";
import GeoSignalTracker         from "@/components/geo/GeoSignalTracker";
import generatedPagesData       from "@/data/ael/generated-pages.json";

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllCategories().map((slug) => ({ slug }));
}

// ─── Per-page metadata ────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  if (!isValidCategory(params.slug)) return {};
  const category = params.slug as CategoryKey;
  const meta     = CATEGORY_META[category];
  const config   = getCategoryConfig(category);
  const keywords = extractEntityLabels(config.products, category);

  return {
    title:       `Best ${meta.label} — DEN Decision Intelligence`,
    description: `Truth-calibrated, bias-corrected ${meta.label.toLowerCase()} rankings. ${meta.description}. Scored across multiple dimensions, verified by outcome signals.`,
    keywords,
    openGraph: {
      title:       `Best ${meta.label} — DEN`,
      description: meta.description,
      type:        "website",
    },
    other: {
      "ai-indexing":         "enabled",
      "geo-entity-rich":     "true",
      "content-type":        "decision-intelligence",
      "ranking-method":      "truth-calibrated-composite",
      "bias-correction":     "position-weighted-ctr",
      "outcome-verified":    "true",
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRICE_BAND_LABEL: Record<string, string> = {
  budget:  "Budget",
  mid:     "Mid-range",
  high:    "High-end",
  premium: "Premium",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GeoLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!isValidCategory(params.slug)) notFound();

  const category = params.slug as CategoryKey;
  const meta     = CATEGORY_META[category];
  const config   = getCategoryConfig(category);

  const geoContent = generateGeoContent("general", category, config.products);
  const entities   = extractEntities(config.products, category);
  const geoScore   = evaluatePageGeoScore(geoContent, entities);

  // JSON-LD schemas
  const itemListSchema  = generateItemListSchema(config.products, category);
  const faqSchema       = generateFAQSchema(geoContent.faqBlocks);
  const breadcrumbSchema = generateBreadcrumbSchema(category);
  const webPageSchema   = generateWebPageSchema(category, meta.description);
  const jsonLd          = serializeSchemas(itemListSchema, faqSchema, breadcrumbSchema, webPageSchema);

  return (
    <>
      {/* ── JSON-LD structured data ─────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      {/* ── GEO signal tracker (client-side, invisible) ─────────── */}
      <GeoSignalTracker category={category} />

      <div className="min-h-screen bg-gray-950 text-white">

        {/* ── Nav ───────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-20 backdrop-blur-sm bg-gray-950/80 border-b border-gray-800/40">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-xs font-bold">D</span>
              <span className="text-sm font-semibold text-white">DEN</span>
            </Link>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="text-gray-300 font-medium">{meta.label}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400">
                GEO Score {geoScore.total} · {geoScore.grade}
              </span>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">

          {/* ── SECTION 1 — Machine Summary Block ─────────────────── */}
          <section id="summary" aria-label="Category Summary" className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-400">
                Decision Intelligence · {meta.label}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">
                Best {meta.label}
              </h1>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Machine Summary</span>
                <span className="text-[10px] text-gray-700">· AI-readable factual overview</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {geoContent.summary}
              </p>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-gray-800">
                <div>
                  <dt className="text-[10px] text-gray-600 uppercase tracking-widest">Products ranked</dt>
                  <dd className="text-lg font-bold tabular-nums">{config.products.length}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-gray-600 uppercase tracking-widest">Ranking method</dt>
                  <dd className="text-sm font-semibold text-indigo-400">Truth-calibrated</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-gray-600 uppercase tracking-widest">Bias correction</dt>
                  <dd className="text-sm font-semibold text-emerald-400">Position-weighted</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-gray-600 uppercase tracking-widest">Outcome verified</dt>
                  <dd className="text-sm font-semibold text-violet-400">Yes</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* ── SECTION 2 — Comparison Table ──────────────────────── */}
          <section id="comparison" aria-label="Product Comparison Table" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Product Comparison</h2>
              <p className="text-xs text-gray-500">All scores 0–100. Performance = weighted composite of all dimension scores.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm" aria-label={`${meta.label} comparison table`}>
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Product</th>
                    <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Brand</th>
                    <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider font-semibold text-right">Performance</th>
                    <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider font-semibold text-right">Battery</th>
                    <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider font-semibold text-right">Value</th>
                    <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Use Case</th>
                    <th className="px-5 py-3.5 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Price Band</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {geoContent.comparisonTable.map((row, i) => (
                    <tr key={row.product} className={i === 0 ? "bg-indigo-950/20" : "hover:bg-gray-800/20"}>
                      <td className="px-5 py-3.5 font-medium text-gray-200">{row.product}</td>
                      <td className="px-5 py-3.5 text-gray-400">{row.brand}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`tabular-nums font-bold ${row.performance >= 80 ? "text-indigo-400" : row.performance >= 60 ? "text-gray-300" : "text-gray-500"}`}>
                          {row.performance}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`tabular-nums ${row.battery >= 80 ? "text-emerald-400" : "text-gray-400"}`}>
                          {row.battery}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`tabular-nums ${row.value >= 80 ? "text-amber-400" : "text-gray-400"}`}>
                          {row.value}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">{row.useCase}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                          {PRICE_BAND_LABEL[row.priceBand] ?? row.priceBand}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── SECTION 3 — Decision Breakdown Logic ──────────────── */}
          <section id="decision-logic" aria-label="Ranking Decision Logic" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">How Rankings Are Computed</h2>
              <p className="text-xs text-gray-500">
                Deterministic scoring process — no black boxes, no sponsored placement.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <ol className="space-y-3">
                {geoContent.decisionLogic.map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-[11px] font-bold text-indigo-400 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {/* Strip the "Step N —" prefix since we show numbered bullets */}
                      {step.replace(/^Step \d+ — /, "")}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── SECTION 4 — Entity Panel ───────────────────────────── */}
          <section id="entities" aria-label="Entity Index" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Entity Index</h2>
              <p className="text-xs text-gray-500">
                Products, brands, use cases, and performance attributes covered on this page.
              </p>
            </div>

            <div className="space-y-4">
              {(["product", "brand", "use-case", "performance-attribute"] as const).map((type) => {
                const group = entities.filter((e) => e.type === type);
                if (group.length === 0) return null;
                const typeLabel: Record<string, string> = {
                  "product":              "Products",
                  "brand":                "Brands",
                  "use-case":             "Use Cases",
                  "performance-attribute": "Performance Attributes",
                };
                return (
                  <div key={type} className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      {typeLabel[type]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.map((e) => (
                        <span
                          key={e.label}
                          className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full"
                        >
                          {e.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── SECTION 5 — FAQ Block ──────────────────────────────── */}
          <section id="faq" aria-label="Frequently Asked Questions" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Common Questions</h2>
              <p className="text-xs text-gray-500">
                Factual answers about {meta.label.toLowerCase()} rankings and the DEN scoring system.
              </p>
            </div>

            <div className="space-y-3">
              {geoContent.faqBlocks.map((faq, i) => (
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

          {/* ── SECTION 6 — Intent Rankings (generated pages) ─────── */}
          {(() => {
            const intentPages = (generatedPagesData.pages as Array<{ slug: string; title: string; h1: string; intent: string; category: string; description: string; confidence: number }>)
              .filter((p) => p.category === category);

            if (intentPages.length === 0) return null;

            return (
              <section aria-label="Browse by intent" className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight">Browse by Intent</h2>
                  <p className="text-xs text-gray-500">
                    Focused rankings for specific use cases — each scored for a single intent.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {intentPages.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/generated/${p.slug}`}
                      className="group flex flex-col gap-1 bg-gray-900 border border-gray-800 hover:border-indigo-800/50 rounded-xl px-4 py-3.5 transition-all duration-150 hover:-translate-y-0.5"
                    >
                      <span className="text-sm font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors">
                        {p.h1}
                      </span>
                      <span className="text-xs text-gray-500 line-clamp-2">{p.description}</span>
                      <span className="text-[10px] text-indigo-500 font-mono mt-0.5">
                        {p.intent.replace(/_/g, " ")} · {Math.round(p.confidence * 100)}% confidence
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* ── CTA ───────────────────────────────────────────────── */}
          <section aria-label="Get personalised recommendation" className="text-center space-y-4 py-6 border-t border-gray-800/50">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Get your personalised {meta.label.toLowerCase()} pick</h2>
              <p className="text-sm text-gray-500">
                Answer 6 questions. The intelligence engine scores every option against your exact profile.
              </p>
            </div>
            <Link
              href={`/quiz?category=${category}`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-8 py-3.5 transition-all duration-150 active:scale-[0.98] shadow-lg shadow-indigo-900/30 text-sm"
            >
              Find my best {meta.label.toLowerCase().replace(/s$/, "")}
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </section>

          {/* ── Footer ────────────────────────────────────────────── */}
          <footer className="text-center text-xs text-gray-700 pb-4 space-y-1">
            <p>DEN — Decision Intelligence · Rankings updated in real time</p>
            <p>No sponsored placements · No affiliate ranking manipulation</p>
          </footer>

        </main>
      </div>
    </>
  );
}
