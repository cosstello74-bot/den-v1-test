/**
 * PopularGuides — internal-link block from a category hub to its AEL-generated
 * landing pages (/generated/[slug]).
 *
 * Why this exists: the generated pages were orphaned — nothing on the
 * user-facing site linked to them, so search engines had no crawl path and
 * they received zero traffic. Rendering this on each hub gives Googlebot a
 * route in and passes internal link equity to the long-tail pages.
 *
 * Server component — no client JS.
 */

import Link from "next/link";
import generatedPagesData from "@/data/ael/generated-pages.json";

interface GeneratedPage {
  slug:        string;
  title:       string;
  category:    string;
  geoKeywords: string[];
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function PopularGuides({
  categories,
  limit = 8,
  heading = "Popular guides",
}: {
  /** Category keys to include (e.g. ["laptops","phones","monitors"]). */
  categories: string[];
  limit?: number;
  heading?: string;
}) {
  const pages = (generatedPagesData.pages as GeneratedPage[])
    .filter((p) => categories.includes(p.category))
    .slice(0, limit);

  if (pages.length === 0) return null;

  return (
    <section className="mt-12 border-t border-ink/10 pt-8">
      <p className="text-[11px] font-semibold tracking-widest text-muted uppercase mb-4">
        {heading}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pages.map((p) => (
          <Link
            key={p.slug}
            href={`/generated/${p.slug}`}
            className="group flex items-center justify-between gap-3 bg-paper-soft hover:bg-[#ddd6c4] border border-ink/12 hover:border-accent/40 rounded-xl px-4 py-3 transition-all duration-150"
          >
            <span className="text-sm text-ink group-hover:text-accent transition-colors duration-150">
              {p.title.replace(/\s+/g, " ").trim()}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
