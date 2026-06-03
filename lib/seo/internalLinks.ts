/**
 * v3 Internal linking engine.
 *
 * Defines the link graph between all DEN landing pages.
 * Every page links to:
 *   - its quiz entry point (with intent prefill)
 *   - 2 related landing pages (topical relevance)
 *   - /results (direct funnel shortcut)
 *
 * Used by TrafficLandingTemplate and the GeoBlock component.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type InternalLink = {
  slug:        string;
  href:        string;   // full path e.g. /best-laptops-for-gaming
  title:       string;
  description: string;
};

export type PageLinkConfig = {
  slug:     string;
  quizHref: string;       // quiz URL with intent + category prefill
  related:  InternalLink[];
};

// ─── Link graph ───────────────────────────────────────────────────────────────

const GRAPH: Record<string, PageLinkConfig> = {

  "best-laptops-for-gaming": {
    slug:     "best-laptops-for-gaming",
    quizHref: "/quiz?category=laptops&intent=gaming",
    related: [
      {
        slug:        "best-budget-laptops",
        href:        "/best-budget-laptops",
        title:       "Best Budget Laptops",
        description: "High-value picks under £600",
      },
      {
        slug:        "laptops-for-coding",
        href:        "/laptops-for-coding",
        title:       "Best Laptops for Coding",
        description: "Developer-optimised productivity picks",
      },
    ],
  },

  "best-laptops-for-students": {
    slug:     "best-laptops-for-students",
    quizHref: "/quiz?category=laptops&intent=student",
    related: [
      {
        slug:        "best-budget-laptops",
        href:        "/best-budget-laptops",
        title:       "Best Budget Laptops",
        description: "Maximum value at entry-level price points",
      },
      {
        slug:        "work-from-home-laptops",
        href:        "/work-from-home-laptops",
        title:       "Work-From-Home Laptops",
        description: "Battery + productivity ranked for remote use",
      },
    ],
  },

  "best-budget-laptops": {
    slug:     "best-budget-laptops",
    quizHref: "/quiz?category=laptops&intent=budget",
    related: [
      {
        slug:        "best-laptops-for-students",
        href:        "/best-laptops-for-students",
        title:       "Best Laptops for Students",
        description: "Value-first picks ranked for university",
      },
      {
        slug:        "work-from-home-laptops",
        href:        "/work-from-home-laptops",
        title:       "Work-From-Home Laptops",
        description: "All-day battery, productivity-focused",
      },
    ],
  },

  "laptops-for-coding": {
    slug:     "laptops-for-coding",
    quizHref: "/quiz?category=laptops&intent=coding",
    related: [
      {
        slug:        "best-laptops-for-gaming",
        href:        "/best-laptops-for-gaming",
        title:       "Best Laptops for Gaming",
        description: "GPU-focused performance rankings",
      },
      {
        slug:        "work-from-home-laptops",
        href:        "/work-from-home-laptops",
        title:       "Work-From-Home Laptops",
        description: "Productivity and battery for remote dev work",
      },
    ],
  },

  "work-from-home-laptops": {
    slug:     "work-from-home-laptops",
    quizHref: "/quiz?category=laptops&intent=work",
    related: [
      {
        slug:        "best-laptops-for-students",
        href:        "/best-laptops-for-students",
        title:       "Best Laptops for Students",
        description: "Battery + value for everyday tasks",
      },
      {
        slug:        "laptops-for-coding",
        href:        "/laptops-for-coding",
        title:       "Best Laptops for Coding",
        description: "Productivity-first with dev-grade performance",
      },
    ],
  },

  // GEO category pages
  "laptops": {
    slug:     "laptops",
    quizHref: "/quiz?category=laptops",
    related: [
      {
        slug:        "best-laptops-for-gaming",
        href:        "/best-laptops-for-gaming",
        title:       "Best Laptops for Gaming",
        description: "Performance-ranked gaming picks",
      },
      {
        slug:        "best-laptops-for-students",
        href:        "/best-laptops-for-students",
        title:       "Best Laptops for Students",
        description: "Value-first university rankings",
      },
    ],
  },

};

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get link config for a page slug. Falls back to category root. */
export function getPageLinks(slug: string): PageLinkConfig {
  return GRAPH[slug] ?? {
    slug,
    quizHref: "/quiz?category=laptops",
    related:  [],
  };
}

/** Get 2 related pages for a given slug. */
export function getRelatedPages(slug: string): InternalLink[] {
  return getPageLinks(slug).related;
}

/** Get intent-prefilled quiz URL for a given slug. */
export function getQuizHref(slug: string): string {
  return getPageLinks(slug).quizHref;
}

/** All slugs in the link graph — used for sitemap generation. */
export function getAllLinkedSlugs(): string[] {
  return Object.keys(GRAPH);
}
