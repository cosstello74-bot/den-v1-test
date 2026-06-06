import type { Metadata }           from "next";
import type { Product }             from "@/types/product";
import allProducts                  from "@/data/products.json";
import TrafficLandingTemplate       from "@/components/landing/TrafficLandingTemplate";
import { buildMeta }                from "@/lib/seo/metaBuilder";
import {
  generateItemListSchema,
  generateFAQSchema,
  serializeSchemas,
} from "@/lib/geo/schemaGenerator";
import { getRelatedPages, getQuizHref } from "@/lib/seo/internalLinks";

const SLUG = "best-budget-laptops";

// ─── Product selection ────────────────────────────────────────────────────────

const PRODUCT_IDS = ["p2", "p8", "p10"] as const;

const products = allProducts.products.filter(
  (p) => (PRODUCT_IDS as readonly string[]).includes(p.id)
) as unknown as Product[];

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMeta({
  title:         "Best Budget Laptops — DEN Decision Intelligence",
  description:   "Top budget laptops ranked for value, reliability, and daily performance. Scored objectively — no price inflation, no sponsored positions.",
  slug:          "best-budget-laptops",
  h1:            "Best Budget Laptops",
  intentKeyword: "best budget laptops",
  keywords:      [
    "best budget laptops",
    "cheap laptops",
    "affordable laptops under 500",
    "best laptop under 600",
    "budget laptop 2024",
  ],
  pageType: "landing",
});

// ─── FAQ content ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What is a good budget laptop price range?",
    answer:   "Budget laptops typically sit in the £300–£600 range. DEN's value score identifies which options deliver the most capability per pound, weighting actual performance against price band.",
  },
  {
    question: "Can a budget laptop handle everyday tasks?",
    answer:   "Yes — modern budget laptops handle web browsing, document editing, video streaming, and video calls without issue. DEN filters out value-score outliers that overpromise on price.",
  },
  {
    question: "What are the trade-offs on budget laptops?",
    answer:   "Common trade-offs are build quality (plastic chassis vs aluminium), display resolution (1080p vs 4K), and battery life. DEN's truth signal tracks which trade-offs users find acceptable over time.",
  },
  {
    question: "Are these the cheapest laptops available?",
    answer:   "No — these are the best-value options. DEN optimises for score-per-pound, not lowest price. A £480 laptop with a value score of 90 ranks above a £350 laptop with a value score of 65.",
  },
];

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLd = serializeSchemas(
  generateItemListSchema(products, "laptops"),
  generateFAQSchema(FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer })))
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BestBudgetLaptopsPage() {
  return (
    <TrafficLandingTemplate
      meta={{
        h1:            "Best Budget Laptops",
        intentKeyword: "best budget laptops",
        description:   "Top budget laptops ranked for value, reliability, and real-world performance. Scored objectively — no price inflation, no sponsored positions.",
        category:      "laptops",
        keywords:      [
          "best budget laptops",
          "cheap laptops",
          "affordable laptops under 500",
          "best laptop under 600",
        ],
        quizHref:     getQuizHref(SLUG),
        relatedLinks: getRelatedPages(SLUG),
      }}
      products={products}
      faqItems={FAQ_ITEMS}
      jsonLd={jsonLd}
    />
  );
}
