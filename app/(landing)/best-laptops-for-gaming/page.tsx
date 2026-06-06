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

const SLUG = "best-laptops-for-gaming";

// ─── Product selection ────────────────────────────────────────────────────────

const PRODUCT_IDS = ["p1", "p4", "p11"] as const;

const products = allProducts.products.filter(
  (p) => (PRODUCT_IDS as readonly string[]).includes(p.id)
) as unknown as Product[];

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMeta({
  title:         "Best Laptops for Gaming — DEN Decision Intelligence",
  description:   "Truth-calibrated gaming laptop rankings. Scored on GPU performance, thermal capability, frame rates, and real-world gaming benchmarks. No sponsored placements.",
  slug:          "best-laptops-for-gaming",
  h1:            "Best Laptops for Gaming",
  intentKeyword: "best gaming laptops",
  keywords:      [
    "best gaming laptops",
    "gaming laptop 2024",
    "top gaming laptops",
    "gaming laptop under 1000",
    "best performance gaming laptop",
  ],
  pageType: "landing",
});

// ─── FAQ content ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What makes a laptop good for gaming?",
    answer:   "Key factors are GPU performance, thermal design (cooling), RAM (16GB+), and display refresh rate (120Hz+). The DEN gaming score weights these against real-world benchmark data.",
  },
  {
    question: "Are these rankings sponsored?",
    answer:   "No. DEN uses truth-calibrated scoring — rankings are computed from objective hardware specs and outcome-verified session signals. Affiliate relationships do not influence position.",
  },
  {
    question: "What budget do I need for a good gaming laptop?",
    answer:   "A competitive mid-range gaming laptop sits in the £600–£1000 range. Premium GPUs and full-resolution panels push into £1000–£1500. DEN scores value efficiency alongside raw performance.",
  },
  {
    question: "How often are these rankings updated?",
    answer:   "Rankings update continuously as new user outcome signals arrive and are verified. The truth-calibrated system corrects for position bias and segment differences automatically.",
  },
];

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLd = serializeSchemas(
  generateItemListSchema(products, "laptops"),
  generateFAQSchema(FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer })))
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BestLaptopsForGamingPage() {
  return (
    <TrafficLandingTemplate
      meta={{
        h1:            "Best Laptops for Gaming",
        intentKeyword: "best gaming laptops",
        description:   "Truth-calibrated gaming laptop rankings. GPU performance, thermal design, and frame-rate capability scored and verified by real outcome signals. No sponsored results.",
        category:      "laptops",
        keywords:      [
          "best gaming laptops",
          "gaming laptop 2024",
          "top gaming laptops",
          "gaming laptop under 1000",
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
