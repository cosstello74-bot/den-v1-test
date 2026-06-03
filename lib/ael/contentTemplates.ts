/**
 * v4 Content Templates.
 *
 * Deterministic structured content for AEL-generated pages.
 * No AI generation — pure template + data combination.
 *
 * Template types: gaming, student, coding, budget, travel, creative, professional, generic
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentTemplateType =
  | "gaming"
  | "student"
  | "coding"
  | "budget"
  | "travel"
  | "creative"
  | "professional"
  | "generic";

export type ContentTemplate = {
  type:          ContentTemplateType;
  /** Factual paragraph explaining the ranking methodology for this intent. */
  decisionBlock: string;
  /** Short one-sentence intent summary for the hero area. */
  intentSummary: string;
  /** Additional entity terms to inject into the entity index. */
  entityHints:   string[];
  /** Intent-specific FAQ items. Supplement GEO engine FAQ output. */
  faqItems:      Array<{ question: string; answer: string }>;
};

// ─── Template registry ────────────────────────────────────────────────────────

const TEMPLATES: Record<ContentTemplateType, ContentTemplate> = {

  gaming: {
    type: "gaming",
    decisionBlock:
      "Gaming laptops are ranked using a GPU-weighted scoring formula. The primary signal is gaming_score, reflecting GPU tier, VRAM capacity, and sustained thermal performance under load. Secondary signals include display refresh rate (minimum 120Hz threshold), RAM configuration (16GB baseline), and cooling system architecture. DEN applies truth calibration to gaming segment outcome data to surface models with verified satisfaction in competitive and AAA title scenarios.",
    intentSummary:
      "Truth-calibrated ranking for gaming use cases. GPU performance and thermal design weighted as primary signals.",
    entityHints: [
      "GPU", "NVIDIA", "AMD Radeon", "RTX 4060", "144Hz", "165Hz", "VRAM",
      "thermal design", "frame rate", "gaming performance", "dedicated graphics",
    ],
    faqItems: [
      {
        question: "What GPU do I need for gaming at 1080p?",
        answer:   "For 1080p gaming at high settings, an NVIDIA RTX 4060 or AMD Radeon RX 7700S delivers strong frame rates. DEN's gaming score weights GPU tier as the primary signal and applies truth calibration using real segment outcome data to verify performance claims.",
      },
      {
        question: "How important is display refresh rate for gaming?",
        answer:   "A minimum of 120Hz is required for fluid competitive gaming; 144Hz or 165Hz provides noticeably smoother gameplay. DEN applies a display refresh rate threshold filter to gaming-intent rankings — sub-120Hz panels reduce the gaming score regardless of other dimensions.",
      },
      {
        question: "Should I prioritise battery life or gaming performance?",
        answer:   "High-performance GPUs consume significant power, making strong battery and high gaming scores mutually exclusive. DEN's gaming-intent rankings deprioritise battery score in favour of GPU capability. If portability and battery are equally important, DEN's travel or work intent pages surface better alternatives.",
      },
    ],
  },

  student: {
    type: "student",
    decisionBlock:
      "Student laptops are scored with elevated weight on value_score and battery_score, reflecting the priorities of university life: cost efficiency and all-day unplugged use. DEN applies a student segment multiplier that deprioritises premium-priced options and surfaces high-value alternatives at budget and mid price points. Truth calibration adjusts rankings using outcome signals specifically from the student segment cohort.",
    intentSummary:
      "Truth-calibrated ranking for student use cases. Value and battery endurance are primary scoring dimensions.",
    entityHints: [
      "university", "student", "all-day battery", "lightweight", "value",
      "note-taking", "essay writing", "lecture", "budget", "student discount",
    ],
    faqItems: [
      {
        question: "Do students need a powerful laptop?",
        answer:   "Most university work — writing, research, presentations, and video calls — runs well on mid-range hardware. DEN's student profile de-emphasises gaming and creative performance in favour of cost efficiency. A £400–£650 laptop with a modern multi-core CPU handles standard coursework comfortably.",
      },
      {
        question: "How many hours of battery life do students need?",
        answer:   "A minimum of 8 hours real-world battery is recommended for a full day of lectures and study. DEN's battery_score is calibrated using truth signals — rated manufacturer figures are discounted by a realism factor derived from verified outcome data.",
      },
      {
        question: "MacBook or Windows laptop for students?",
        answer:   "Both are viable. MacBooks offer superior battery life and build quality; Windows laptops offer more flexibility and lower entry cost. DEN scores both ecosystems objectively — the right choice depends on your degree programme's software requirements and available budget.",
      },
    ],
  },

  coding: {
    type: "coding",
    decisionBlock:
      "Developer laptops are ranked with productivity_score as the primary signal, reflecting CPU multi-thread performance — the primary bottleneck in compilation, running dev servers, and container workloads. Secondary signals include RAM capacity (16GB minimum, 32GB recommended), display pixel density for long coding sessions, and battery endurance for remote work. Rankings are verified against professional segment outcome signals.",
    intentSummary:
      "Truth-calibrated ranking for software development. CPU performance and productivity are primary scoring dimensions.",
    entityHints: [
      "IDE", "compiler", "Docker", "terminal", "RAM", "CPU cores", "SSD speed",
      "developer tools", "productivity", "MacBook", "ThinkPad", "WSL", "Linux",
    ],
    faqItems: [
      {
        question: "How much RAM do I need for software development?",
        answer:   "16GB is the minimum comfortable configuration for running an IDE, browser, and dev server concurrently. 32GB is recommended for Docker-heavy workflows, machine learning, or native macOS/iOS development. DEN's developer rankings surface both tiers separately.",
      },
      {
        question: "Does the operating system matter for coding?",
        answer:   "macOS provides native Unix tooling and excellent developer experience. Linux (available on ThinkPad, Dell) offers maximum control. Windows 11 with WSL2 provides a practical middle ground. DEN scores across all platforms objectively — operating system is not a ranking factor.",
      },
      {
        question: "Do I need a dedicated GPU for coding?",
        answer:   "No for most software development. Web, mobile, and backend work require no GPU beyond integrated graphics. Machine learning, data science, and game development benefit from a dedicated GPU. DEN's developer intent pages surface GPU-relevant products separately when applicable.",
      },
    ],
  },

  budget: {
    type: "budget",
    decisionBlock:
      "Budget laptops are ranked primarily on value_score — a composite measure of capability delivered per pound of price. DEN's budget intent filter applies the budget price band constraint (under £500) and ranks by value-efficiency rather than absolute performance. Truth calibration corrects for inflated manufacturer specifications in the budget tier by applying real-world outcome signal verification.",
    intentSummary:
      "Truth-calibrated ranking for value-focused buyers. Maximum capability per pound is the primary scoring objective.",
    entityHints: [
      "value", "affordable", "entry-level", "price-to-performance",
      "budget tier", "under £500", "everyday tasks", "cost efficient",
    ],
    faqItems: [
      {
        question: "What is the best budget laptop under £500?",
        answer:   "The best value under £500 depends on your use case. DEN's budget rankings weight value_score as the primary signal. Look for models scoring 85+ on DEN's value scale in the budget price band — these represent the strongest capability-per-pound ratios in the category.",
      },
      {
        question: "What trade-offs come with budget laptops?",
        answer:   "Common trade-offs are build quality (plastic vs aluminium), display resolution (1080p FHD is fine; avoid 1366×768), and upgrade-ability. DEN's truth signal filters products where users report quality issues, naturally removing the weakest budget options from rankings.",
      },
      {
        question: "Is a budget laptop suitable for work and study?",
        answer:   "Yes, for standard workloads. Web browsing, document editing, video calls, and light media consumption run well on budget hardware. DEN verifies this against outcome data from student and general segments, who form the majority of budget laptop buyers.",
      },
    ],
  },

  travel: {
    type: "travel",
    decisionBlock:
      "Travel laptops are ranked with portability_score and battery_score as co-primary signals, reflecting the non-negotiable requirements of mobile use: lightweight form factor and all-day endurance. DEN applies minimum thresholds of portability_score ≥ 80 and battery_score ≥ 80 for travel-intent rankings — products below either threshold are excluded regardless of other score dimensions.",
    intentSummary:
      "Truth-calibrated ranking for mobile professionals and frequent travellers. Portability and battery endurance are co-primary signals.",
    entityHints: [
      "lightweight", "all-day battery", "compact", "carry-on safe",
      "13 inch", "14 inch", "thin", "portable", "travel-friendly", "under 1.5kg",
    ],
    faqItems: [
      {
        question: "How light should a travel laptop be?",
        answer:   "Under 1.5kg is excellent for daily carry; under 1.8kg is comfortable. DEN's portability_score incorporates chassis weight, dimensions, and verified carry comfort from user outcome signals.",
      },
      {
        question: "What battery life do I need for travel?",
        answer:   "10+ hours real-world battery enables a full day of work without a charger on flights and in hotels. DEN verifies battery claims using truth calibration — advertised figures are discounted using a realism factor derived from verified session outcome data.",
      },
      {
        question: "13-inch or 14-inch for travel?",
        answer:   "13-inch offers maximum portability; 14-inch provides better ergonomics and screen real estate with marginally increased weight. Both score well on DEN's portability scale. The choice depends on whether the laptop is your primary display or secondary to an external monitor.",
      },
    ],
  },

  creative: {
    type: "creative",
    decisionBlock:
      "Creative laptops are ranked with productivity_score as the primary signal, reflecting CPU and GPU performance for rendering, video encoding, and design workloads. Display quality — colour gamut coverage, resolution, and accuracy — is a secondary signal. DEN's creative intent template surfaces products in the high and premium price tiers where sustained performance and display fidelity justify the price point. Rankings are verified against creator segment outcome signals.",
    intentSummary:
      "Truth-calibrated ranking for creative professionals. CPU performance, GPU capability, and display quality are primary scoring dimensions.",
    entityHints: [
      "video editing", "colour accuracy", "sRGB", "DCI-P3", "4K display",
      "rendering", "GPU VRAM", "CPU performance", "Premiere Pro",
      "DaVinci Resolve", "Final Cut Pro", "content creation",
    ],
    faqItems: [
      {
        question: "What specs matter most for video editing?",
        answer:   "CPU multi-thread performance (rendering and export), GPU VRAM (hardware acceleration in Premiere Pro, DaVinci Resolve), RAM (32GB recommended), and display colour accuracy (sRGB ≥95% or wide P3 coverage). DEN's creative intent page weights these with a productivity-first profile.",
      },
      {
        question: "Do I need a 4K display for creative work?",
        answer:   "4K is beneficial for photo and video editing where fine detail matters. For general graphic design and UI work, a high-quality 2.5K (2560×1600) display provides sufficient pixel density without the battery penalty of 4K panels. DEN includes display quality as a secondary scoring dimension.",
      },
      {
        question: "Is a MacBook worth it for creative professionals?",
        answer:   "Apple M-series chips deliver exceptional video encoding via the dedicated media engine and provide industry-leading performance-per-watt. MacBook Air M2 and MacBook Pro M3 consistently rank in DEN's top creative tier, verified by creator segment outcome data.",
      },
    ],
  },

  professional: {
    type: "professional",
    decisionBlock:
      "Professional laptops are ranked with productivity_score as the primary signal, incorporating CPU sustained performance, keyboard quality, build reliability, and enterprise ecosystem integration. DEN applies a professional segment multiplier (1.30×) reflecting higher purchase budgets and stronger intent signals in this cohort. Rankings are verified against professional segment outcome data — a high-converting segment with strong purchase intent signals.",
    intentSummary:
      "Truth-calibrated ranking for professional productivity. Sustained performance, reliability, and build quality are primary dimensions.",
    entityHints: [
      "professional", "enterprise", "ThinkPad", "Dell XPS", "MacBook Pro",
      "productivity", "reliability", "keyboard quality", "build quality",
      "sustained performance", "professional segment",
    ],
    faqItems: [
      {
        question: "What is the best laptop for professional productivity?",
        answer:   "Professional productivity laptops score highest on sustained CPU performance, keyboard quality, and long-term build durability. DEN's professional intent page weights productivity_score × 0.50 and applies the professional segment multiplier. ThinkPad, Dell XPS, and MacBook Pro consistently rank in this tier.",
      },
      {
        question: "How long should a professional laptop last?",
        answer:   "A mid-to-high-tier professional laptop should last 4–5 years under business workloads. DEN's truth signal tracks outcome data including product returns, filtering out models with early reliability issues from the professional segment rankings.",
      },
      {
        question: "Is the MacBook Pro worth the premium for professionals?",
        answer:   "For professionals using macOS-native tools (Xcode, Final Cut, Logic Pro) or requiring best-in-class battery endurance alongside performance — yes. For Windows-native enterprise environments, premium ThinkPad or Dell XPS models provide comparable build quality. DEN scores both ecosystems objectively.",
      },
    ],
  },

  generic: {
    type: "generic",
    decisionBlock:
      "Rankings are computed using DEN's truth-calibrated multi-dimensional scoring system. Products are evaluated across gaming, productivity, battery, portability, and value dimensions, with weights adjusted for the detected use-case intent. All rankings are verified against real outcome signals from user sessions and corrected for position bias.",
    intentSummary:
      "Truth-calibrated rankings across the full product range. Use DEN's quiz for intent-specific personalised scoring.",
    entityHints: [],
    faqItems: [
      {
        question: "How does DEN rank products?",
        answer:   "DEN uses a multi-dimensional scoring system combining use-case performance scores, truth calibration from outcome signals, and segment-specific revenue weighting. The final composite score weights intelligence at 55%, revenue efficiency at 35%, and behaviour signals at 10%.",
      },
      {
        question: "Are rankings sponsored or paid placements?",
        answer:   "No. DEN's ranking algorithm is deterministic and explicitly designed to resist revenue gaming. Affiliate relationships do not influence ranking position — revenue efficiency is a secondary weighted input, not a primary one.",
      },
    ],
  },

};

// ─── Intent key → template mapping ───────────────────────────────────────────

const INTENT_TEMPLATE_MAP: Record<string, ContentTemplateType> = {
  gaming_budget:          "gaming",
  gaming_mid:             "gaming",
  gaming_high:            "gaming",
  gaming_premium:         "gaming",
  gaming_any:             "gaming",
  student_value:          "student",
  student_budget:         "student",
  student_mid:            "student",
  student_any:            "student",
  developer_professional: "coding",
  professional_budget:    "professional",
  professional_mid:       "professional",
  professional_high:      "professional",
  professional_premium:   "professional",
  professional_any:       "professional",
  travel_portable:        "travel",
  creative_professional:  "creative",
  creative_budget:        "creative",
  creative_mid:           "creative",
  creative_high:          "creative",
  creative_premium:       "creative",
  creative_any:           "creative",
  budget_general:         "budget",
  budget_any:             "budget",
  premium_professional:   "professional",
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getContentTemplate(intentKey: string): ContentTemplate {
  const type = INTENT_TEMPLATE_MAP[intentKey] ?? "generic";
  return TEMPLATES[type];
}

export function getTemplateByType(type: ContentTemplateType): ContentTemplate {
  return TEMPLATES[type];
}

export function getAllTemplateTypes(): ContentTemplateType[] {
  return Object.keys(TEMPLATES) as ContentTemplateType[];
}
