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

const SLUG = "laptops-for-coding";

// ─── Product selection ────────────────────────────────────────────────────────

const PRODUCT_IDS = ["p3", "p5", "p6", "p9"] as const;

const products = allProducts.products.filter(
  (p) => (PRODUCT_IDS as readonly string[]).includes(p.id)
) as unknown as Product[];

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMeta({
  title:         "Best Laptops for Coding — DEN Decision Intelligence",
  description:   "Developer-optimised laptop rankings. Productivity-first with secondary weighting on battery life and display quality. Scored for software development workflows.",
  slug:          "laptops-for-coding",
  h1:            "Best Laptops for Coding",
  intentKeyword: "best laptop for coding",
  keywords:      [
    "best laptop for coding",
    "developer laptop",
    "programming laptop",
    "laptop for software engineering",
    "best laptop for web development",
  ],
  pageType: "landing",
});

// ─── FAQ content ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What specs matter most for coding?",
    answer:   "CPU performance, RAM (16GB minimum, 32GB ideal), and display quality are the top priorities. Battery matters for remote/café work. DEN weights productivity_score highest for developer-intent profiles.",
  },
  {
    question: "Is a MacBook better than Windows for development?",
    answer:   "MacBooks offer excellent Unix compatibility, battery life, and trackpad quality. Windows laptops provide more spec-per-pound and wider hardware choice. DEN scores both objectively — the best choice depends on your stack.",
  },
  {
    question: "Do I need a dedicated GPU for coding?",
    answer:   "For most software development — no. Dedicated GPUs matter for ML/data science work, game development, or GPU-accelerated tasks. For web, backend, or mobile dev, integrated graphics are sufficient.",
  },
  {
    question: "What screen size is best for coding?",
    answer:   "14-inch offers the best balance of portability and screen real estate. 15-16 inch gives more pixels for multi-pane editing but increases weight. DEN's portability score reflects real-world carry comfort.",
  },
];

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLd = serializeSchemas(
  generateItemListSchema(products, "laptops"),
  generateFAQSchema(FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer })))
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LaptopsForCodingPage() {
  return (
    <TrafficLandingTemplate
      meta={{
        h1:            "Best Laptops for Coding",
        intentKeyword: "best laptop for coding",
        description:   "Developer-optimised laptop rankings. Productivity-first with secondary weighting on battery and display. Scored for software development workflows.",
        category:      "laptops",
        keywords:      [
          "best laptop for coding",
          "developer laptop",
          "programming laptop",
          "laptop for software engineering",
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
