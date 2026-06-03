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

const SLUG = "work-from-home-laptops";

// ─── Product selection ────────────────────────────────────────────────────────

const PRODUCT_IDS = ["p3", "p6", "p7", "p9", "p12"] as const;

const products = allProducts.products.filter(
  (p): p is Product => (PRODUCT_IDS as readonly string[]).includes(p.id)
);

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMeta({
  title:         "Best Work-From-Home Laptops — DEN Decision Intelligence",
  description:   "Laptops ranked for remote work and home office use. Weighted on video call performance, all-day battery, keyboard quality, and display clarity.",
  slug:          "work-from-home-laptops",
  h1:            "Best Work-From-Home Laptops",
  intentKeyword: "best work from home laptops",
  keywords:      [
    "best work from home laptops",
    "best laptops for remote work",
    "home office laptop",
    "laptop for video calls",
    "best wfh laptop 2024",
  ],
  pageType: "landing",
});

// ─── FAQ content ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What makes a laptop good for working from home?",
    answer:   "All-day battery (8h+), good webcam and microphone for video calls, a comfortable keyboard for long typing sessions, and a high-quality display to reduce eye strain. DEN ranks these under the productivity and battery dimensions.",
  },
  {
    question: "Do I need a high-end laptop for remote work?",
    answer:   "Not necessarily. Most remote work — emails, video calls, documents, spreadsheets — runs well on mid-range hardware. DEN identifies the sweet spot between capability and cost for WFH use cases.",
  },
  {
    question: "Should I get a 13-14 inch or 15-16 inch for WFH?",
    answer:   "If you have a separate monitor, 13-14 inch portability is ideal. If the laptop is your primary display, 15-inch gives more workspace. Both score well in DEN's WFH profile.",
  },
  {
    question: "Is battery life important if I work at a desk all day?",
    answer:   "Yes — consistently poor battery life indicates a less efficient processor, which also means more heat and fan noise. DEN's truth signal filters products where battery underperforms vs rated specs.",
  },
];

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLd = serializeSchemas(
  generateItemListSchema(products, "laptops"),
  generateFAQSchema(FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer })))
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkFromHomeLaptopsPage() {
  return (
    <TrafficLandingTemplate
      meta={{
        h1:            "Best Work-From-Home Laptops",
        intentKeyword: "best work from home laptops",
        description:   "Laptops ranked for remote work and home office use. Battery, productivity, and portability weighted for WFH workflows.",
        category:      "laptops",
        keywords:      [
          "best work from home laptops",
          "best laptops for remote work",
          "home office laptop",
          "laptop for video calls",
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
