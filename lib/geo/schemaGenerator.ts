import type { Product, CategoryKey } from "@/types/product";
import type { FaqBlock }            from "./geoContentEngine";

// ─── ItemList schema ──────────────────────────────────────────────────────────

export function generateItemListSchema(
  products: Product[],
  category: CategoryKey,
  baseUrl:  string = "https://den.ai"
): object {
  return {
    "@context":        "https://schema.org",
    "@type":           "ItemList",
    "name":            `Best ${category.charAt(0).toUpperCase() + category.slice(1)} — DEN Rankings`,
    "description":     `Truth-calibrated, outcome-verified ranking of top ${category} based on use-case scoring, segment intelligence, and position-bias correction.`,
    "numberOfItems":   products.length,
    "itemListOrder":   "https://schema.org/ItemListOrderDescending",
    "itemListElement": products.map((p, i) => ({
      "@type":    "ListItem",
      "position": i + 1,
      "name":     p.name,
      "url":      `${baseUrl}/${category}#${p.id}`,
      "item": {
        "@type":  "Product",
        "name":   p.name,
        "brand": {
          "@type": "Brand",
          "name":  p.brand,
        },
        "category": category,
        "offers": {
          "@type":          "Offer",
          "priceCurrency":  "GBP",
          "availability":   "https://schema.org/InStock",
          "priceRange":     priceBandToRange(p.price_band),
        },
        "aggregateRating": {
          "@type":       "AggregateRating",
          "ratingValue": ((p.value_score + p.productivity_score) / 2 / 10).toFixed(1),
          "bestRating":  "10",
          "worstRating": "1",
          "ratingCount": "50",
        },
      },
    })),
  };
}

// ─── FAQPage schema ───────────────────────────────────────────────────────────

export function generateFAQSchema(faqs: FaqBlock[]): object {
  return {
    "@context":    "https://schema.org",
    "@type":       "FAQPage",
    "mainEntity":  faqs.map((faq) => ({
      "@type":          "Question",
      "name":           faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text":  faq.answer,
      },
    })),
  };
}

// ─── BreadcrumbList schema ────────────────────────────────────────────────────

export function generateBreadcrumbSchema(
  category: CategoryKey,
  baseUrl:  string = "https://den.ai"
): object {
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    "@context":     "https://schema.org",
    "@type":        "BreadcrumbList",
    "itemListElement": [
      {
        "@type":    "ListItem",
        "position": 1,
        "name":     "DEN",
        "item":     baseUrl,
      },
      {
        "@type":    "ListItem",
        "position": 2,
        "name":     label,
        "item":     `${baseUrl}/${category}`,
      },
    ],
  };
}

// ─── WebPage schema ───────────────────────────────────────────────────────────

export function generateWebPageSchema(
  category:    CategoryKey,
  description: string,
  baseUrl:     string = "https://den.ai"
): object {
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    "@context":   "https://schema.org",
    "@type":      "WebPage",
    "name":       `Best ${label} — DEN Decision Intelligence`,
    "url":        `${baseUrl}/${category}`,
    "description": description,
    "inLanguage":  "en-GB",
    "publisher": {
      "@type": "Organization",
      "name":  "DEN",
      "url":   baseUrl,
    },
    "about": {
      "@type": "Thing",
      "name":  label,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priceBandToRange(band: string): string {
  switch (band) {
    case "budget":  return "£0 - £500";
    case "mid":     return "£500 - £1000";
    case "high":    return "£1000 - £1500";
    case "premium": return "£1500+";
    default:        return "£0+";
  }
}

/**
 * Serialise one or more schemas into a single JSON-LD script tag content.
 */
export function serializeSchemas(...schemas: object[]): string {
  if (schemas.length === 1) return JSON.stringify(schemas[0], null, 2);
  return JSON.stringify({ "@graph": schemas }, null, 2);
}
