import type { Product }  from "@/types/product";
import type { CategoryKey } from "@/types/product";

// ─── Output types ─────────────────────────────────────────────────────────────

export type ComparisonRow = {
  product:     string;
  brand:       string;
  performance: number; // 0-100 composite
  battery:     number;
  value:       number;
  useCase:     string;
  priceBand:   string;
};

export type FaqBlock = {
  question: string;
  answer:   string;
};

export type GeoContent = {
  summary:         string;
  entityList:      string[];
  comparisonTable: ComparisonRow[];
  decisionLogic:   string[];
  faqBlocks:       FaqBlock[];
};

// ─── Category knowledge base ──────────────────────────────────────────────────

const CATEGORY_SUMMARIES: Record<CategoryKey, string> = {
  laptops: "Laptops are portable computing devices evaluated across performance, battery life, portability, and value. Rankings are computed using a multi-dimensional weighted scoring system that accounts for use-case intent (gaming, work, creative, university), budget constraints, portability requirements, and screen size preference. Outcome signals from real sessions are used to calibrate truth scores and correct position bias.",
  phones: "Smartphones are evaluated across camera quality, battery capacity, processing performance, and value. Rankings incorporate real-world usage patterns, segment-specific preferences, and outcome-verified signals to surface the best match for each user profile.",
  monitors: "Monitors are scored on panel type, refresh rate, colour accuracy, resolution, and value. Recommendations are adjusted for intended use: gaming monitors prioritise response time and refresh rate; creative monitors prioritise colour gamut and resolution.",
  tablets: "Tablets are assessed for processing power, display quality, battery endurance, input support, and ecosystem compatibility. Rankings weight portability and use-case alignment — education, creative work, and media consumption each produce different optimal choices.",
  pcs: "Desktop PCs are evaluated on processing throughput, GPU capability, memory capacity, upgradeability, and value-per-performance. Segment weighting adjusts rankings for professional workloads, gaming, and general productivity.",
  health: "Health supplements are scored across five dimensions: effectiveness (potency for stated goal), ingredient quality (purity and sourcing), scientific backing (evidence base), ease of use (taste, format convenience), and value for money. Rankings weight goal alignment first — fitness goals surface high-protein and performance products; natural/organic goals surface Linwoods whole-food products; general wellness surfaces science-backed daily vitamins.",
  "travel-insurance": "Travel insurance policies are scored across five dimensions: medical coverage quality (highest weight), policy breadth and coverage comprehensiveness, cancellation and disruption cover, ease of purchase and claim experience, and price-to-coverage value. Rankings weight trip type first — single-trip intent surfaces the best single-trip policies; annual multi-trip intent surfaces annual policies. Destination then applies a match bonus: Europe or Worldwide filters surface the most relevant policy scope.",
};

const CATEGORY_USE_CASES: Record<CategoryKey, string[]> = {
  laptops:            ["gaming", "professional work", "university study", "creative production", "everyday use"],
  phones:             ["photography", "productivity", "gaming", "long battery life", "everyday communication"],
  monitors:           ["gaming", "video editing", "graphic design", "office productivity", "dual-screen setup"],
  tablets:            ["note-taking", "digital art", "media consumption", "mobile work", "education"],
  pcs:                ["gaming", "video editing", "3D rendering", "software development", "home office"],
  health:             ["fitness and performance", "general wellness", "weight management", "organic and natural nutrition"],
  "travel-insurance": ["single trip holidays", "annual multi-trip travel", "European city breaks", "worldwide adventure travel", "skiing and winter sports", "backpacker trips"],
};

const DECISION_LOGIC_TEMPLATES: Record<CategoryKey, string[]> = {
  laptops: [
    "Step 1 — Use-case scoring: gaming purpose weights gaming_score × 0.40; work purpose weights productivity_score × 0.40; university purpose weights value_score × 0.25.",
    "Step 2 — Battery weighting: very-important battery preference adds battery_score × 0.20; somewhat-important adds battery_score × 0.10.",
    "Step 3 — Portability weighting: frequent travel adds portability_score × 0.20; occasional travel adds portability_score × 0.10.",
    "Step 4 — Preference bonuses: exact screen size match adds +10 points; preferred brand match adds +10 points.",
    "Step 5 — Truth multiplier: products with verified positive outcomes receive up to 1.30× multiplier; sparse-data products receive 0.70× until sufficient outcomes accumulate.",
    "Step 6 — Segment adjustment: professional segment applies 1.30× revenue multiplier; student segment applies 0.70× for value-weighted ordering.",
    "Step 7 — Bias correction: position-weighted impressions normalise CTR to remove presentation-order bias (rank-1 weight: 1.0, rank-2: 0.8, rank-3: 0.6, rank-4+: 0.4).",
    "Step 8 — Composite score: final display order = 0.60 × intelligence score + 0.40 × revenue score.",
  ],
  phones: [
    "Step 1 — Camera and battery scores are primary signals for photography and endurance use cases.",
    "Step 2 — Performance score weights are increased for gaming and professional segments.",
    "Step 3 — Value score receives elevated weight for student and budget segments.",
    "Step 4 — Truth calibration adjusts rankings using outcome-verified conversion signals.",
    "Step 5 — Composite scoring applies 0.60 × intelligence + 0.40 × revenue weighting.",
  ],
  monitors: [
    "Step 1 — Gaming monitors: refresh rate and response time are primary performance signals.",
    "Step 2 — Creative monitors: colour accuracy and resolution receive elevated weights.",
    "Step 3 — Value weighting adjusts based on stated budget band.",
    "Step 4 — Truth calibration applies outcome-verified purchase intent signals.",
    "Step 5 — Composite scoring: 0.60 × intelligence + 0.40 × revenue efficiency.",
  ],
  tablets: [
    "Step 1 — Use-case detection maps creative purpose to productivity score, education to value score.",
    "Step 2 — Portability score receives a 0.15× bonus for frequently-travel profiles.",
    "Step 3 — Battery score weight increases for extended daily-use profiles.",
    "Step 4 — Truth model adjusts scores using outcome-verified session data.",
    "Step 5 — Composite scoring: 0.60 × intelligence + 0.40 × revenue efficiency.",
  ],
  pcs: [
    "Step 1 — Gaming purpose weights gaming_score × 0.40; work purpose weights productivity_score × 0.40.",
    "Step 2 — Budget band maps to value_score weighting: under-500 → value × 0.30; 1500+ → performance × 0.25.",
    "Step 3 — Professional segment applies 1.30× revenue multiplier.",
    "Step 4 — Truth model applies bias-corrected CTR and outcome-verified conversion rates.",
    "Step 5 — Composite scoring: 0.60 × intelligence + 0.40 × revenue efficiency.",
  ],
  health: [
    "Step 1 — Goal mapping: fitness → effectiveness (gaming_score × 0.40); general wellness → scientific backing (productivity_score × 0.40); weight management → value (value_score × 0.25); organic → ingredient quality emphasis.",
    "Step 2 — Activity level: very-active applies ingredient quality bonus (battery_score × 0.20) and ease-of-use weight (portability_score × 0.20).",
    "Step 3 — Dietary preference: vegan/natural routes brand_preference to Linwoods, surfacing organic plant-based products first.",
    "Step 4 — Category bias: effectiveness (+0.15×), ingredient quality (+0.10×), scientific backing (+0.12×), value (+0.15×) applied across all results.",
    "Step 5 — Truth calibration and composite scoring applied once outcome data accumulates.",
  ],
  "travel-insurance": [
    "Step 1 — Trip type: single-trip purpose weights gaming_score (policy breadth) × 0.40; annual purpose weights productivity_score (cancellation cover) × 0.40.",
    "Step 2 — Destination match bonus: destination='europe' adds +10 to products with screen_size='europe'; destination='worldwide' adds +10 to products with screen_size='worldwide'.",
    "Step 3 — Activities: adventure/extreme activities set battery_importance=very-important, boosting battery_score (medical coverage) × 0.20.",
    "Step 4 — Value weighting: budget band maps to value_score weight; lower budgets elevate value_score; higher budgets allow policy breadth to dominate.",
    "Step 5 — Composite scoring: 0.60 × intelligence + 0.40 × revenue efficiency applied once outcome data accumulates.",
  ],
};

const FAQ_TEMPLATES: Record<CategoryKey, FaqBlock[]> = {
  laptops: [
    {
      question: "How are laptop recommendations ranked on DEN?",
      answer: "Rankings use a multi-dimensional weighted score combining use-case fit, battery importance, portability needs, screen size preference, and brand preference. A truth calibration layer applies outcome-verified signals to correct for position bias and adjust for user segment. The final display order weights intelligence score at 60% and revenue efficiency at 40%.",
    },
    {
      question: "What is the best laptop for gaming under £1000?",
      answer: "Gaming laptops under £1000 in the mid price band are scored primarily on gaming_score (weight 0.40) and value_score. Models with dedicated NVIDIA or AMD GPUs, 8GB+ VRAM, and 144Hz+ displays receive the highest gaming scores. DEN applies truth-calibrated signals to surface models with verified purchase satisfaction in the gaming segment.",
    },
    {
      question: "What factors matter most for a student laptop?",
      answer: "Student laptops are evaluated with elevated weight on value_score (0.25), battery_score (important for all-day use), and portability_score. The student segment profile applies a 0.70× revenue multiplier to deprioritise premium-priced options and surface high-value, lightweight alternatives.",
    },
    {
      question: "What is the best laptop for professional work?",
      answer: "Professional laptops score highest on productivity_score (weight 0.40), battery reliability, and build quality. The professional segment applies a 1.30× revenue multiplier reflecting higher average order values and budget availability. MacBook Pro and ThinkPad lines consistently rank highest in this segment.",
    },
    {
      question: "How does DEN correct for recommendation bias?",
      answer: "DEN uses position-weighted CTR correction: rank-1 impressions are weighted at 1.0, rank-2 at 0.8, rank-3 at 0.6, and rank-4+ at 0.4. This normalises click-through rates to remove presentation-order bias. Outcome signals (product returns, confirmed conversions) further calibrate truth scores using a decay constant of λ=0.075.",
    },
    {
      question: "What is truth-calibrated intelligence?",
      answer: "Truth calibration is a system where product rankings are adjusted using real outcome signals: conversion confirmations increase a product's truth score, while returns and conversion failures decrease it. Products with truth scores ≥0.8 receive a 1.30× ranking multiplier. Sparse-data products (fewer than 10 interactions) receive a 0.50× confidence weight until sufficient data accumulates.",
    },
  ],
  phones: [
    {
      question: "How are phone recommendations ranked on DEN?",
      answer: "Phone rankings combine camera score, battery score, performance score, and value score using use-case weighted multipliers. Truth calibration adjusts for real-world outcome signals. Final ordering is 60% intelligence score and 40% revenue efficiency.",
    },
    {
      question: "What is the best phone for photography?",
      answer: "Photography phones score highest on camera score and colour accuracy. DEN weights camera_score × 0.40 for the photography use case and applies truth signals to surface phones with verified purchase satisfaction in the photography segment.",
    },
    {
      question: "How does segment detection work?",
      answer: "DEN maps user purpose to a segment (student, gamer, professional, creator, general) and applies a segment-specific revenue multiplier: professional 1.30×, creator 1.15×, gamer 1.00×, general 0.90×, student 0.70×. This adjusts ranking to match segment value and purchasing behaviour.",
    },
  ],
  monitors: [
    {
      question: "How are monitor recommendations ranked on DEN?",
      answer: "Monitor rankings weight refresh rate and response time for gaming use cases, and colour accuracy and resolution for creative use cases. Truth calibration and composite scoring (60% intelligence, 40% revenue) determine final ordering.",
    },
    {
      question: "What is the best gaming monitor?",
      answer: "Gaming monitors are scored primarily on refresh rate (144Hz minimum for high scores), response time (1ms GtG), and panel type. IPS panels score higher for colour while TN panels score higher for raw response time. DEN uses outcome-verified signals to surface monitors with verified gaming satisfaction.",
    },
  ],
  tablets: [
    {
      question: "How are tablet recommendations ranked on DEN?",
      answer: "Tablets are scored on processing speed, display quality, battery endurance, input support, and value. Use-case weighting adjusts for creative, educational, and productivity profiles. Truth calibration and composite scoring determine final ordering.",
    },
    {
      question: "What is the best tablet for note-taking and study?",
      answer: "Study tablets score highest on value_score, battery endurance, and stylus compatibility. The student segment applies a 0.70× revenue multiplier to surface high-value options. Apple iPad and Samsung Galaxy Tab lines consistently score well in this category.",
    },
  ],
  pcs: [
    {
      question: "How are desktop PC recommendations ranked on DEN?",
      answer: "Desktop PCs are scored on processing throughput, GPU capability, memory, storage, and value-per-performance. Gaming use cases weight gaming_score × 0.40; professional workloads weight productivity_score × 0.40. Composite scoring is 60% intelligence and 40% revenue efficiency.",
    },
    {
      question: "What is the best desktop PC for video editing?",
      answer: "Video editing PCs require high productivity_score (CPU multi-thread performance) and sufficient GPU for hardware acceleration. DEN weights these for the creative use case and applies the creator segment multiplier (1.15×). Systems with 16GB+ RAM and dedicated GPU score highest.",
    },
  ],
  health: [
    {
      question: "How are supplement recommendations ranked on DEN?",
      answer: "Supplements are scored across effectiveness, ingredient quality, scientific backing, ease of use, and value for money. Rankings weight your stated goal first — fitness goals surface high-performance products; organic goals surface Linwoods whole-food range; general wellness weights scientific backing. Truth calibration adjusts rankings as outcome data accumulates.",
    },
    {
      question: "What is the best protein supplement for fitness?",
      answer: "Fitness supplements score highest on effectiveness (gaming_score) and scientific backing (productivity_score). Sci-Mx Ultra Whey and All-In-One Extreme rank at the top for fitness goals, with effectiveness scores above 90. Creatine monohydrate has the strongest scientific evidence base in the dataset.",
    },
    {
      question: "What is the best supplement for general daily health?",
      answer: "General wellness recommendations weight scientific backing and value for money. Known Nutrition Daily Multivitamin leads for everyday use due to its high ease-of-use score and competitive value. Linwoods Milled Flaxseed scores highest on ingredient quality and value in the organic segment.",
    },
  ],
  "travel-insurance": [
    {
      question: "How are travel insurance recommendations ranked on DEN?",
      answer: "Travel insurance policies are scored across medical coverage quality, policy breadth, cancellation cover, ease of claim, and value for money. Rankings weight trip type first — single-trip or annual — then apply a destination match bonus (Europe or Worldwide) and adjust medical coverage weight for adventure activity needs. Composite scoring is 60% intelligence and 40% revenue efficiency.",
    },
    {
      question: "What is the best travel insurance for a single trip to Europe?",
      answer: "For a single Europe trip, DEN weights policy breadth (gaming_score) × 0.40 and value for money (value_score) × 0.25. Coverwise Single Trip Europe scores highest in this segment at value_score 92, making it the top recommendation for standard European holidays.",
    },
    {
      question: "Is annual multi-trip insurance worth it?",
      answer: "Annual multi-trip insurance scores highest on cancellation and disruption cover (productivity_score × 0.40) and value over multiple trips. Coverwise Annual Multi-Trip Europe has value_score 90 — for travellers taking two or more trips per year it typically costs less per trip than individual policies and removes the hassle of re-purchasing cover.",
    },
  ],
};

// ─── Main function ────────────────────────────────────────────────────────────

function useCaseLabel(category: string): string {
  const map: Record<string, string> = {
    gaming:     "Gaming",
    work:       "Professional work",
    creative:   "Creative production",
    university: "University",
    general:    "Everyday use",
  };
  return map[category] ?? "General use";
}

export function generateGeoContent(
  intent:   string,
  category: CategoryKey,
  products: Product[]
): GeoContent {
  const summary = CATEGORY_SUMMARIES[category] ?? CATEGORY_SUMMARIES.laptops;

  // Entity list
  const entityList: string[] = [
    ...products.map((p) => p.name),
    ...Array.from(new Set(products.map((p) => p.brand))),
    ...(CATEGORY_USE_CASES[category] ?? []),
    category.charAt(0).toUpperCase() + category.slice(1),
  ].filter(Boolean);

  // Comparison table
  const comparisonTable: ComparisonRow[] = products.map((p) => ({
    product:     p.name,
    brand:       p.brand,
    performance: Math.round(
      (p.gaming_score * 0.3 + p.productivity_score * 0.4 + p.battery_score * 0.15 + p.portability_score * 0.15)
    ),
    battery:   p.battery_score,
    value:     p.value_score,
    useCase:   useCaseLabel(p.category),
    priceBand: p.price_band,
  })).sort((a, b) => b.performance - a.performance);

  const decisionLogic  = DECISION_LOGIC_TEMPLATES[category] ?? DECISION_LOGIC_TEMPLATES.laptops;
  const faqBlocks      = FAQ_TEMPLATES[category]             ?? FAQ_TEMPLATES.laptops;

  return { summary, entityList, comparisonTable, decisionLogic, faqBlocks };
}
