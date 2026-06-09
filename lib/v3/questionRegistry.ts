/**
 * V3 — Category Question Registry
 * Returns category-specific quiz steps. Each category gets its own set of
 * questions and options — no laptop attributes leak into phone or monitor flows.
 *
 * answer IDs `purpose` and `budget` are kept consistent across all categories
 * so the results page can read them from URL params without changes.
 */

import type { CategoryKey } from "@/types/product";

// ─── Step type ────────────────────────────────────────────────────────────────

export type QuizOption = {
  value:       string;
  label:       string;
  description: string;
};

export type QuizStep = {
  id:       string;
  question: string;
  subtitle: string;
  options:  QuizOption[];
};

// ─── Laptops ──────────────────────────────────────────────────────────────────

const LAPTOP_STEPS: QuizStep[] = [
  {
    id:       "purpose",
    question: "What will you mainly use it for?",
    subtitle: "This shapes your entire recommendation profile.",
    options: [
      { value: "gaming",     label: "Gaming",      description: "High-performance games and streaming" },
      { value: "work",       label: "Work",         description: "Productivity, docs and video calls" },
      { value: "university", label: "University",   description: "Student work, research and notes" },
      { value: "creative",   label: "Creative",     description: "Design, video editing and music" },
    ],
  },
  {
    id:       "budget",
    question: "What's your budget?",
    subtitle: "We'll find the best value at your price point.",
    options: [
      { value: "under-500",  label: "Under £500",     description: "Entry-level, great for everyday tasks" },
      { value: "500-1000",   label: "£500–£1,000",    description: "Mid-range, solid all-round performance" },
      { value: "1000-1500",  label: "£1,000–£1,500",  description: "High-end, powerful and refined" },
      { value: "1500+",      label: "£1,500+",         description: "Premium, absolutely no compromise" },
    ],
  },
  {
    id:       "battery_importance",
    question: "How important is battery life?",
    subtitle: "Be honest — do you actually leave your desk?",
    options: [
      { value: "not-important",      label: "Not Important",      description: "I'm always near a power outlet" },
      { value: "somewhat-important", label: "Somewhat Important", description: "Nice to have but not critical" },
      { value: "very-important",     label: "Very Important",     description: "I need all-day battery life" },
    ],
  },
  {
    id:       "portability",
    question: "How often will you carry it?",
    subtitle: "Weight and form factor depend heavily on this.",
    options: [
      { value: "desk-use",            label: "Mostly Desk Use",     description: "Stays at home or the office" },
      { value: "occasionally-travel", label: "Occasionally Travel", description: "Commute a few times a week" },
      { value: "frequently-travel",   label: "Frequently Travel",   description: "Always on the move" },
    ],
  },
  {
    id:       "screen_size",
    question: "Preferred screen size?",
    subtitle: "Bigger isn't always better — it depends on your use.",
    options: [
      { value: "13-14",         label: "13–14 inch",    description: "Compact and lightweight" },
      { value: "15-16",         label: "15–16 inch",    description: "Balanced size and real estate" },
      { value: "17+",           label: "17+ inch",      description: "Maximum screen space" },
      { value: "no-preference", label: "No Preference", description: "Open to anything" },
    ],
  },
  {
    id:       "brand_preference",
    question: "Any brand preference?",
    subtitle: "If not, we'll ignore brand and optimise purely on value.",
    options: [
      { value: "no-preference", label: "No Preference", description: "Show me the best regardless of brand" },
      { value: "Lenovo",        label: "Lenovo",         description: "Reliability and value" },
      { value: "ASUS",          label: "ASUS",           description: "Innovative designs" },
      { value: "HP",            label: "HP",             description: "Versatile work and home" },
      { value: "Dell",          label: "Dell",           description: "Premium build quality" },
      { value: "Apple",         label: "Apple",          description: "macOS and M-series chips" },
    ],
  },
];

// ─── Phones ───────────────────────────────────────────────────────────────────

const PHONE_STEPS: QuizStep[] = [
  {
    id:       "purpose",
    question: "How do you mainly use your phone?",
    subtitle: "This determines which attributes matter most.",
    options: [
      { value: "photography", label: "Photography",  description: "Camera quality is everything" },
      { value: "gaming",      label: "Gaming",        description: "Performance and display refresh rate" },
      { value: "work",        label: "Work",           description: "Productivity, email and calls" },
      { value: "everyday",    label: "Everyday",      description: "General use, social and browsing" },
    ],
  },
  {
    id:       "budget",
    question: "What's your budget?",
    subtitle: "We'll surface the best phone at your price point.",
    options: [
      { value: "under-300",  label: "Under £300",   description: "Entry-level, great value" },
      { value: "300-600",    label: "£300–£600",    description: "Mid-range with flagship features" },
      { value: "600-900",    label: "£600–£900",    description: "Premium performance" },
      { value: "900+",       label: "£900+",         description: "Flagship, no compromise" },
    ],
  },
  {
    id:       "os_preference",
    question: "Android or iPhone?",
    subtitle: "Both have genuine strengths — this narrows the field fast.",
    options: [
      { value: "no-preference", label: "No Preference", description: "Show me the best regardless of OS" },
      { value: "android",       label: "Android",        description: "Open ecosystem, more choice" },
      { value: "ios",           label: "iPhone (iOS)",   description: "Seamless Apple ecosystem" },
    ],
  },
  {
    id:       "battery_importance",
    question: "How critical is battery life?",
    subtitle: "Some users charge twice a day — others need two days.",
    options: [
      { value: "not-important",      label: "Not Important",      description: "I charge at my desk regularly" },
      { value: "somewhat-important", label: "Somewhat Important", description: "I want a full day minimum" },
      { value: "very-important",     label: "Very Important",     description: "I need two days or more" },
    ],
  },
  {
    id:       "screen_size",
    question: "Preferred screen size?",
    subtitle: "Pocket comfort vs. viewing real estate.",
    options: [
      { value: "compact",       label: "Compact (under 6.1\")",  description: "One-handed use, pocket-friendly" },
      { value: "standard",      label: "Standard (6.1\"–6.7\")", description: "The sweet spot for most users" },
      { value: "large",         label: "Large (6.7\"+)",         description: "Big display for media and gaming" },
      { value: "no-preference", label: "No Preference",          description: "Open to any size" },
    ],
  },
];

// ─── Monitors ─────────────────────────────────────────────────────────────────

const MONITOR_STEPS: QuizStep[] = [
  {
    id:       "purpose",
    question: "What's the monitor mainly for?",
    subtitle: "Gaming and creative work need very different panels.",
    options: [
      { value: "gaming",   label: "Gaming",   description: "Fast refresh rate and low input lag" },
      { value: "creative", label: "Creative", description: "Colour accuracy and wide gamut" },
      { value: "work",     label: "Office",    description: "Sharp text and comfortable viewing" },
      { value: "mixed",    label: "Mixed Use", description: "Good all-rounder" },
    ],
  },
  {
    id:       "budget",
    question: "What's your budget?",
    subtitle: "Panel quality scales significantly with price.",
    options: [
      { value: "under-200", label: "Under £200",  description: "Solid entry-level" },
      { value: "200-400",   label: "£200–£400",   description: "Where most great panels live" },
      { value: "400-700",   label: "£400–£700",   description: "High-end IPS or OLED" },
      { value: "700+",      label: "£700+",        description: "Top-tier professional or gaming" },
    ],
  },
  {
    id:       "resolution",
    question: "Which resolution?",
    subtitle: "Higher resolution needs a more powerful GPU.",
    options: [
      { value: "1080p",         label: "1080p (Full HD)",  description: "Best for gaming performance" },
      { value: "1440p",         label: "1440p (QHD)",      description: "The sweet spot for sharpness" },
      { value: "4k",            label: "4K (Ultra HD)",    description: "Maximum detail for creative work" },
      { value: "no-preference", label: "No Preference",    description: "Optimise on other factors" },
    ],
  },
  {
    id:       "refresh_priority",
    question: "What refresh rate do you need?",
    subtitle: "Critical for gaming, less so for office use.",
    options: [
      { value: "60hz",  label: "60 Hz is fine",    description: "Office and productivity work" },
      { value: "144hz", label: "144 Hz+",           description: "Smooth gaming and fast UI" },
      { value: "240hz", label: "240 Hz+",           description: "Competitive gaming only" },
    ],
  },
  {
    id:       "screen_size",
    question: "Preferred screen size?",
    subtitle: "Desk depth matters — bigger isn't always practical.",
    options: [
      { value: "24-or-less",    label: "24\" or smaller",  description: "Compact and space-efficient" },
      { value: "27inch",        label: "27 inch",          description: "The most popular choice" },
      { value: "32-plus",       label: "32\"+ / Ultrawide", description: "Maximum real estate" },
      { value: "no-preference", label: "No Preference",    description: "Open to anything" },
    ],
  },
];

// ─── Tablets ──────────────────────────────────────────────────────────────────

const TABLET_STEPS: QuizStep[] = [
  {
    id:       "purpose",
    question: "What's the tablet mainly for?",
    subtitle: "Purpose determines OS, stylus support and form factor.",
    options: [
      { value: "university", label: "Student Work", description: "Notes, research and documents" },
      { value: "creative",   label: "Creative",     description: "Drawing, design and illustration" },
      { value: "media",      label: "Media",         description: "Streaming, reading and browsing" },
      { value: "gaming",     label: "Gaming",        description: "Mobile games and emulation" },
    ],
  },
  {
    id:       "budget",
    question: "What's your budget?",
    subtitle: "Tablet value varies hugely by tier.",
    options: [
      { value: "under-300", label: "Under £300",  description: "Entry-level Android or iPad" },
      { value: "300-600",   label: "£300–£600",   description: "Mid-range with good performance" },
      { value: "600-900",   label: "£600–£900",   description: "Pro-tier hardware" },
      { value: "900+",      label: "£900+",        description: "iPad Pro / Surface Pro territory" },
    ],
  },
  {
    id:       "os_preference",
    question: "Any OS preference?",
    subtitle: "OS determines the app ecosystem and stylus options.",
    options: [
      { value: "no-preference", label: "No Preference", description: "Show me the best regardless" },
      { value: "ipados",        label: "iPadOS",         description: "Best app ecosystem and Apple Pencil" },
      { value: "android",       label: "Android",        description: "Flexible, open, more affordable" },
      { value: "windows",       label: "Windows",        description: "Full desktop apps on a tablet" },
    ],
  },
  {
    id:       "stylus_needed",
    question: "Do you need stylus support?",
    subtitle: "Essential for note-taking and creative work.",
    options: [
      { value: "yes",           label: "Yes, essential",   description: "I'll write or draw with it" },
      { value: "nice-to-have",  label: "Nice to have",     description: "Would use it if included" },
      { value: "no",            label: "No, touch is fine", description: "Touch only is perfect for me" },
    ],
  },
  {
    id:       "portability",
    question: "How portable does it need to be?",
    subtitle: "Heavier tablets often trade weight for a larger screen.",
    options: [
      { value: "desk-use",            label: "Mostly at Home",    description: "Used on the sofa or desk" },
      { value: "occasionally-travel", label: "Into Work / Uni",   description: "In a bag most days" },
      { value: "frequently-travel",   label: "Always On the Go",  description: "Needs to be light and compact" },
    ],
  },
];

// ─── Desktop PCs ──────────────────────────────────────────────────────────────

const PC_STEPS: QuizStep[] = [
  {
    id:       "purpose",
    question: "What's the desktop PC for?",
    subtitle: "This determines the CPU/GPU balance we optimise for.",
    options: [
      { value: "gaming",   label: "Gaming",            description: "High-frame-rate gaming builds" },
      { value: "work",     label: "Work / Productivity", description: "Office, coding and multi-tasking" },
      { value: "creative", label: "Creative",           description: "Video editing, 3D and design" },
      { value: "general",  label: "General Use",        description: "Browsing, media and light tasks" },
    ],
  },
  {
    id:       "budget",
    question: "What's your budget?",
    subtitle: "Desktop builds offer excellent value at every tier.",
    options: [
      { value: "under-500",  label: "Under £500",     description: "Capable entry-level build" },
      { value: "500-1000",   label: "£500–£1,000",    description: "Solid mid-range performance" },
      { value: "1000-1500",  label: "£1,000–£1,500",  description: "High-end and future-proof" },
      { value: "1500+",      label: "£1,500+",         description: "No-compromise workstation" },
    ],
  },
  {
    id:       "form_factor",
    question: "Preferred form factor?",
    subtitle: "Desk space and upgradability depend on this choice.",
    options: [
      { value: "tower",         label: "Tower",       description: "Most upgradable, best airflow" },
      { value: "mini",          label: "Mini PC",     description: "Compact and space-efficient" },
      { value: "all-in-one",    label: "All-in-One",  description: "Monitor and PC in one unit" },
      { value: "no-preference", label: "No Preference", description: "Recommend the best option" },
    ],
  },
  {
    id:       "battery_importance",
    question: "GPU performance priority?",
    subtitle: "GPU matters most for gaming and creative; CPU-heavy for coding.",
    options: [
      { value: "very-important",     label: "Top Priority",    description: "I need the fastest GPU possible" },
      { value: "somewhat-important", label: "Balanced",        description: "Good GPU, but keep it balanced" },
      { value: "not-important",      label: "CPU-focused",     description: "I care more about CPU cores" },
    ],
  },
];

// ─── Health & Supplements ─────────────────────────────────────────────────────

const HEALTH_STEPS: QuizStep[] = [
  {
    id:       "purpose",
    question: "What's your main health goal?",
    subtitle: "This shapes which products get weighted highest for you.",
    options: [
      { value: "fitness", label: "Fitness & Performance", description: "Build muscle, improve endurance and recovery" },
      { value: "general", label: "General Wellness",      description: "Daily health support and vitality" },
      { value: "weight",  label: "Weight Management",     description: "Support a balanced diet and healthy weight" },
      { value: "organic", label: "Natural & Clean",       description: "Whole-food, organic and minimal ingredients" },
    ],
  },
  {
    id:       "budget",
    question: "Monthly supplement budget?",
    subtitle: "We'll find the best quality at your price point.",
    options: [
      { value: "under-20", label: "Under £20/month",  description: "Essential, no-frills nutrition" },
      { value: "20-40",    label: "£20–£40/month",    description: "Good range and quality" },
      { value: "40-60",    label: "£40–£60/month",    description: "Premium formulations" },
      { value: "60+",      label: "£60+/month",       description: "Comprehensive stack" },
    ],
  },
  {
    id:       "dietary",
    question: "Any dietary requirements?",
    subtitle: "We'll filter out anything that doesn't fit.",
    options: [
      { value: "no-preference", label: "No Preference",  description: "Show me the best regardless" },
      { value: "vegan",         label: "Vegan",           description: "100% plant-based ingredients only" },
      { value: "natural",       label: "Natural Only",    description: "Whole foods, no artificial additives" },
      { value: "gluten-free",   label: "Gluten-Free",     description: "No gluten-containing ingredients" },
    ],
  },
  {
    id:       "lifestyle",
    question: "How active are you?",
    subtitle: "Higher activity needs different formulas and dosages.",
    options: [
      { value: "very-active", label: "Very Active",  description: "Training 4+ times per week" },
      { value: "active",      label: "Active",       description: "Exercise 2–3 times per week" },
      { value: "light",       label: "Light",        description: "Some walking and occasional exercise" },
      { value: "sedentary",   label: "Desk-bound",   description: "Mostly seated, looking to improve" },
    ],
  },
];

// ─── Travel Insurance ─────────────────────────────────────────────────────────

const TRAVEL_INSURANCE_STEPS: QuizStep[] = [
  {
    id:       "trip_type",
    question: "What type of trip cover do you need?",
    subtitle: "Single trip is cheaper for one holiday; annual saves money if you travel twice or more.",
    options: [
      { value: "single-trip", label: "Single Trip",       description: "Cover for one specific trip" },
      { value: "annual",      label: "Annual Multi-Trip", description: "Unlimited trips in a 12-month period" },
    ],
  },
  {
    id:       "destination",
    question: "Where are you travelling?",
    subtitle: "Worldwide cover costs more but is essential outside Europe.",
    options: [
      { value: "europe",    label: "Europe",    description: "EU countries and the UK mainland" },
      { value: "worldwide", label: "Worldwide", description: "Any destination including USA, Asia and beyond" },
    ],
  },
  {
    id:       "activities",
    question: "Any adventure activities planned?",
    subtitle: "Standard cover excludes activities like skiing, diving and trekking above 4,000m.",
    options: [
      { value: "standard",  label: "No — standard holiday", description: "Beaches, cities, sightseeing" },
      { value: "adventure", label: "Yes — adventure sports", description: "Skiing, hiking, water sports, cycling" },
      { value: "extreme",   label: "Yes — extreme sports",   description: "Mountaineering, skydiving, bungee jumping" },
    ],
  },
  {
    id:       "budget",
    question: "Budget for your travel insurance?",
    subtitle: "We'll find the best policy value at your price point.",
    options: [
      { value: "under-20", label: "Under £20",  description: "Essential cover for a short trip" },
      { value: "20-40",    label: "£20–£40",    description: "Good level of cover for most trips" },
      { value: "40-60",    label: "£40–£60",    description: "Comprehensive cover with low excess" },
      { value: "60+",      label: "£60+",       description: "Maximum cover including extended trips" },
    ],
  },
];

// ─── Registry ─────────────────────────────────────────────────────────────────

const QUESTION_REGISTRY: Record<CategoryKey, QuizStep[]> = {
  laptops:            LAPTOP_STEPS,
  phones:             PHONE_STEPS,
  monitors:           MONITOR_STEPS,
  tablets:            TABLET_STEPS,
  pcs:                PC_STEPS,
  health:             HEALTH_STEPS,
  "travel-insurance": TRAVEL_INSURANCE_STEPS,
};

export function getQuestions(category: CategoryKey): QuizStep[] {
  return QUESTION_REGISTRY[category] ?? LAPTOP_STEPS;
}

export function getQuestionCount(category: CategoryKey): number {
  return getQuestions(category).length;
}
