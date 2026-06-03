/**
 * v3 GEO content block — server component.
 *
 * Renders AI-readable structured content for landing pages:
 *   1. Machine summary (factual, entity-rich paragraph)
 *   2. Comparison table (structured product data)
 *   3. Entity list (brands, use cases, performance attributes)
 *   4. FAQ accordion
 *
 * Designed for extraction by AI search systems (Perplexity, ChatGPT, Gemini).
 * All output is factual, comparison-first, and schema-aligned.
 */

import Link from "next/link";
import type { InternalLink } from "@/lib/seo/internalLinks";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GeoComparisonRow = {
  name:        string;
  brand:       string;
  score:       number;
  battery:     number;
  value:       number;
  priceBand:   string;
  useCase:     string;
};

export type GeoFaqItem = {
  question: string;
  answer:   string;
};

export type GeoBlockProps = {
  /** AI-readable factual summary paragraph */
  summary:         string;
  /** Flat entity list: brands, CPUs, GPUs, use cases */
  entityList:      string[];
  /** Structured comparison rows */
  comparisonTable: GeoComparisonRow[];
  /** FAQ Q&A pairs */
  faq:             GeoFaqItem[];
  /** Related internal links (from internalLinks engine) */
  relatedLinks?:   InternalLink[];
  /** Quiz CTA href */
  quizHref?:       string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRICE_BAND: Record<string, string> = {
  budget:  "Budget",
  mid:     "Mid-range",
  high:    "High-end",
  premium: "Premium",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeoBlock({
  summary,
  entityList,
  comparisonTable,
  faq,
  relatedLinks = [],
  quizHref     = "/quiz?category=laptops",
}: GeoBlockProps) {
  return (
    <div className="space-y-10">

      {/* ── Machine Summary ─────────────────────────────────── */}
      <section aria-label="Category summary" className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
          Machine Summary · AI-readable factual overview
        </p>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────── */}
      {comparisonTable.length > 0 && (
        <section aria-label="Product comparison table" className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
            Comparison
          </p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs" aria-label="Product comparison">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider text-right">Score</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider text-right hidden sm:table-cell">Battery</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider text-right hidden sm:table-cell">Value</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider hidden sm:table-cell">Use Case</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {comparisonTable.map((row, i) => (
                  <tr key={row.name} className={i === 0 ? "bg-indigo-950/10" : "hover:bg-gray-800/20"}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-200">{row.name}</div>
                      <div className="text-[10px] text-gray-600">{row.brand}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-indigo-400">
                      {row.score}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400 hidden sm:table-cell">
                      {row.battery}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-400 hidden sm:table-cell">
                      {row.value}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell text-xs">
                      {row.useCase}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                        {PRICE_BAND[row.priceBand] ?? row.priceBand}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Entity List ──────────────────────────────────────── */}
      {entityList.length > 0 && (
        <section aria-label="Entity index" className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
            Entity Index
          </p>
          <div className="flex flex-wrap gap-2">
            {entityList.map((entity) => (
              <span
                key={entity}
                className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full"
              >
                {entity}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────── */}
      {faq.length > 0 && (
        <section aria-label="Frequently asked questions" className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
            Common Questions
          </p>
          <div className="space-y-2">
            {faq.map((item, i) => (
              <details
                key={i}
                className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none select-none">
                  <span className="text-sm font-medium text-gray-200">{item.question}</span>
                  <span className="ml-4 shrink-0 text-gray-600 group-open:rotate-180 transition-transform text-xs">▼</span>
                </summary>
                <div className="px-4 pb-4 border-t border-gray-800 pt-3">
                  <p className="text-sm text-gray-400 leading-relaxed">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── Internal Links ───────────────────────────────────── */}
      {relatedLinks.length > 0 && (
        <section aria-label="Related rankings" className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
            Related Rankings
          </p>
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

      {/* ── Quiz CTA ─────────────────────────────────────────── */}
      <section aria-label="Get personalised recommendation" className="space-y-3 border-t border-gray-800/50 pt-6">
        <p className="text-sm text-gray-400">
          Get a personalised recommendation scored against your exact use case and budget.
        </p>
        <Link
          href={quizHref}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-150 active:scale-[0.98] text-sm"
        >
          Find my best match
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </section>

    </div>
  );
}
