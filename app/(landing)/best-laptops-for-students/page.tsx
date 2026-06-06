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

const SLUG = "best-laptops-for-students";

// ─── Product selection ────────────────────────────────────────────────────────

const PRODUCT_IDS = ["p2", "p7", "p8", "p10"] as const;

const products = allProducts.products.filter(
  (p) => (PRODUCT_IDS as readonly string[]).includes(p.id)
) as unknown as Product[];

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = buildMeta({
  title:         "Best Laptops for Students — DEN Decision Intelligence",
  description:   "Ranked laptops for university and student use. Weighted on value, battery endurance, and portability. Budget and mid-range options scored for cost efficiency.",
  slug:          "best-laptops-for-students",
  h1:            "Best Laptops for Students",
  intentKeyword: "best student laptops",
  keywords:      [
    "best laptops for students",
    "university laptop",
    "cheap laptops for students",
    "student laptop under 700",
    "best budget laptop for uni",
  ],
  pageType: "landing",
});

// ─── FAQ content ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What should students look for in a laptop?",
    answer:   "Battery life (8+ hours), portability (under 1.8kg), and value for money are the top priorities for students. DEN weights these factors higher in the student scoring profile.",
  },
  {
    question: "Is a budget laptop good enough for university?",
    answer:   "For most degree programmes — yes. Budget laptops in the £400–£600 range handle note-taking, essays, research, and video calls comfortably. DEN's value score identifies the best-performing options in this bracket.",
  },
  {
    question: "Should students buy a Mac or Windows laptop?",
    answer:   "Both work for most courses. Macs offer battery and build quality; Windows gives more flexibility and lower entry price. DEN scores objectively across both — your choice should reflect your course software requirements.",
  },
  {
    question: "How long should a student laptop last?",
    answer:   "A well-chosen laptop should last 3–4 years of student use. DEN's truth signal tracks real return and revisit rates, filtering out products with poor durability outcomes.",
  },
];

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLd = serializeSchemas(
  generateItemListSchema(products, "laptops"),
  generateFAQSchema(FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer })))
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BestLaptopsForStudentsPage() {
  return (
    <TrafficLandingTemplate
      meta={{
        h1:            "Best Laptops for Students",
        intentKeyword: "best student laptops",
        description:   "Ranked laptops for university and student use. Weighted on value, battery, and portability. Budget and mid-range options scored for cost efficiency and longevity.",
        category:      "laptops",
        keywords:      [
          "best laptops for students",
          "university laptop",
          "cheap laptops for students",
          "student laptop under 700",
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
