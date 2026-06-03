/**
 * AEL Build Orchestrator
 * Run: npm run ael:build
 *
 * Full expansion cycle:
 * 1. Load analytics
 * 2. Run expansion engine
 * 3. Generate categories
 * 4. Discover intents
 * 5. Generate pages
 * 6. Inject GEO enrichment
 * 7. Revenue scan
 * 8. Feedback loop
 * 9. Persist all state
 */

import fs   from "fs";
import path from "path";

// ── v4 AEL modules ────────────────────────────────────────────────────────────
import { mineIntents, mergeWithVocabulary }                from "../lib/ael/intentMiningEngine";
import { discoverCategories as discoverV4Categories }      from "../lib/ael/categoryDiscoveryEngine";
import { evaluateExpansionTrigger }                        from "../lib/ael/expansionTrigger";
import { buildExpandedLinks, buildLinkMap, mergeLinkMaps } from "../lib/ael/internalLinkExpansion";
import { discoverIntents }                                 from "../lib/ael/intentDiscovery";
import type { IntentSignal }                               from "../lib/ael/intentDiscovery";
import type { GeneratedPageConfig }                        from "../lib/ael/pageGenerator";
import { generatePageFromIntent }                          from "../lib/ael/pageGenerator";
import type { Event }                                      from "../types/event";

// ── Data paths ──────────────────────────────────────────────────────────────
const ROOT            = path.join(__dirname, "..");
const DATA_AEL        = path.join(ROOT, "data", "ael");
const GENERATED_PAGES = path.join(DATA_AEL, "generated-pages.json");
const GENERATED_CATS  = path.join(DATA_AEL, "generated-categories.json");
const EXPANSION_STATE = path.join(DATA_AEL, "expansion-state.json");
const LINK_MAP        = path.join(DATA_AEL, "link-map.json");
const GEO_SIGNALS     = path.join(ROOT, "data", "geoSignals.json");
const REVENUE_MODEL   = path.join(ROOT, "data", "revenueModel.json");
const INTEL_MODEL     = path.join(ROOT, "data", "intelligenceModel.json");
const EVENTS_FILE     = path.join(ROOT, "data", "events.json");

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function log(msg: string): void {
  console.log(`[AEL] ${new Date().toISOString()} — ${msg}`);
}

// ── Inline types (avoid circular import issues in script context) ────────────

type RevenueProduct = { affiliatePayout: number; totalRevenue: number; conversionRate: number; revenueTrend: string };
type RevenueModel   = { products: Record<string, RevenueProduct>; categories: Record<string, unknown> };
type IntelProduct   = { global_ctr: number; weighted_ctr: number; trend: string; segment_ctr: Record<string, number> };
type IntelModel     = { products: Record<string, IntelProduct> };
type GeoSignalsFile = { signals: Array<{ sessionId: string; category: string; scrollDepth: number; faqInteractions: number; convertedToQuiz: boolean }> };

type GeneratedPage = {
  slug: string; title: string; h1: string; intent: string; category: string;
  description: string; productFilter: Record<string, unknown>;
  intentWeights: Record<string, number>; geoKeywords: string[];
  confidence: number; createdAt: string; expansionOpportunityId: string;
};

type GeneratedCategory = {
  id: string; name: string; description: string; baseCategory: string;
  productIds: string[]; filterCriteria: Record<string, unknown>;
  confidence: number; createdAt: string; source: string;
};

type ExpansionOpportunity = {
  id: string; type: string; name: string; category?: string;
  confidence: number; rationale: string; estimatedImpact: string;
  createdAt: string; metadata: Record<string, unknown>;
};

type RevenueScanResult = {
  productId: string; issue: string;
  currentMetrics: Record<string, unknown>;
  suggestion: string; priority: string;
};

type FeedbackRecord = {
  pageSlug: string; generatedAt: string; evaluatedAt: string;
  sessions: number; quizConversions: number; conversionRate: number;
  avgScrollDepth: number; faqEngagement: number; expansionScore: number;
};

type ExpansionState = {
  lastRun: string; totalPagesGenerated: number; totalCategoriesGenerated: number;
  expansionHistory: Array<{ runId: string; timestamp: string; pagesAdded: number; categoriesAdded: number; opportunitiesDetected: number; confidenceThreshold: number }>;
  currentOpportunities: ExpansionOpportunity[];
  revenueScans: RevenueScanResult[];
  feedbackState: { confidenceThreshold: number; expansionRecords: FeedbackRecord[]; avgExpansionScore: number; lastEvaluated: string };
};

// ── Confidence threshold ─────────────────────────────────────────────────────
const CONFIDENCE_THRESHOLD = 0.85;

// ── Category avg conversion ──────────────────────────────────────────────────
const CATEGORY_AVG_CONV = 0.074;

// ── Intent vocabulary (inline subset) ───────────────────────────────────────

type IntentEntry = { slug: string; intent: string; category: string; confidence: number; impact: string; searchVolume: string; conversionPotential: string; productFilter: Record<string, unknown>; intentWeights: Record<string, number>; geoKeywords: string[] };

const INTENT_VOCAB: IntentEntry[] = [
  { slug: "best-gaming-laptops-under-1000",    intent: "gaming_budget",         category: "laptops",  confidence: 0.92, impact: "high",   searchVolume: "high",   conversionPotential: "high",   productFilter: { minGamingScore: 80, priceBands: ["mid","budget"], maxCount: 5 }, intentWeights: { gaming_score: 0.55, value_score: 0.25, productivity_score: 0.10, battery_score: 0.10 }, geoKeywords: ["gaming laptops under 1000","best budget gaming laptops"] },
  { slug: "best-laptops-for-students",          intent: "student_value",         category: "laptops",  confidence: 0.94, impact: "high",   searchVolume: "high",   conversionPotential: "high",   productFilter: { minValueScore: 82, priceBands: ["budget","mid"], maxCount: 5 }, intentWeights: { value_score: 0.40, battery_score: 0.25, portability_score: 0.20, productivity_score: 0.15 }, geoKeywords: ["best student laptops","laptops for university"] },
  { slug: "best-laptops-for-coding",            intent: "developer_professional",category: "laptops",  confidence: 0.90, impact: "high",   searchVolume: "high",   conversionPotential: "high",   productFilter: { minProductivityScore: 88, maxCount: 5 }, intentWeights: { productivity_score: 0.50, battery_score: 0.20, portability_score: 0.15, value_score: 0.15 }, geoKeywords: ["best laptops for coding","developer laptops"] },
  { slug: "lightweight-laptops-for-travel",     intent: "travel_portable",       category: "laptops",  confidence: 0.89, impact: "medium", searchVolume: "medium", conversionPotential: "medium", productFilter: { minPortabilityScore: 80, minBatteryScore: 80, maxCount: 5 }, intentWeights: { portability_score: 0.40, battery_score: 0.35, productivity_score: 0.15, value_score: 0.10 }, geoKeywords: ["lightweight laptops","best travel laptops"] },
  { slug: "best-laptops-for-video-editing",     intent: "creative_professional", category: "laptops",  confidence: 0.87, impact: "medium", searchVolume: "medium", conversionPotential: "high",   productFilter: { minProductivityScore: 90, priceBands: ["high","premium"], maxCount: 5 }, intentWeights: { productivity_score: 0.50, battery_score: 0.20, portability_score: 0.15, value_score: 0.15 }, geoKeywords: ["best laptops for video editing","creative laptops"] },
  { slug: "best-gaming-monitors",               intent: "gaming_monitor",        category: "monitors", confidence: 0.91, impact: "high",   searchVolume: "high",   conversionPotential: "high",   productFilter: { maxCount: 5 }, intentWeights: { gaming_score: 0.60, value_score: 0.20, productivity_score: 0.20 }, geoKeywords: ["best gaming monitors","144hz monitors"] },
  { slug: "best-tablets-for-students",          intent: "student_tablet",        category: "tablets",  confidence: 0.89, impact: "high",   searchVolume: "high",   conversionPotential: "high",   productFilter: { maxCount: 5 }, intentWeights: { value_score: 0.45, battery_score: 0.30, productivity_score: 0.25 }, geoKeywords: ["best tablets for students","student tablet"] },
  { slug: "best-gaming-pcs",                    intent: "gaming_pc",             category: "pcs",      confidence: 0.91, impact: "high",   searchVolume: "high",   conversionPotential: "high",   productFilter: { minGamingScore: 80, maxCount: 5 }, intentWeights: { gaming_score: 0.60, value_score: 0.25, productivity_score: 0.15 }, geoKeywords: ["best gaming PCs","gaming desktop"] },
];

// ── Cluster rules (inline) ───────────────────────────────────────────────────

const CLUSTER_RULES = [
  { id: "ultrabooks",          name: "Ultrabooks",              description: "Ultra-portable laptops with premium battery life.", baseCategory: "laptops", filter: { minPortabilityScore: 80, minBatteryScore: 80 }, minProducts: 3, confidence: 0.91, source: "cluster_portable" },
  { id: "budget-workhorses",   name: "Budget Workhorses",       description: "High-value laptops for budget-conscious buyers.",   baseCategory: "laptops", filter: { minValueScore: 82, minProductivityScore: 75, priceBands: ["budget","mid"] }, minProducts: 3, confidence: 0.88, source: "cluster_value" },
  { id: "performance-gaming",  name: "Performance Gaming",      description: "Top-tier gaming laptops with gaming scores ≥88.",  baseCategory: "laptops", filter: { minGamingScore: 88 }, minProducts: 2, confidence: 0.93, source: "cluster_gaming" },
];

// ── Revenue scan (inline) ────────────────────────────────────────────────────

function scanRevenue(products: Record<string, RevenueProduct>): RevenueScanResult[] {
  const issues: RevenueScanResult[] = [];
  for (const [pid, data] of Object.entries(products)) {
    if (data.affiliatePayout >= 50 && data.conversionRate < CATEGORY_AVG_CONV) {
      issues.push({ productId: pid, issue: "high_payout_low_traffic", currentMetrics: { conversionRate: data.conversionRate, affiliatePayout: data.affiliatePayout, totalRevenue: data.totalRevenue, revenueTrend: data.revenueTrend }, suggestion: `${pid}: payout £${data.affiliatePayout} but conv ${(data.conversionRate*100).toFixed(1)}% below avg. Add to intent pages.`, priority: data.affiliatePayout >= 80 ? "urgent" : "medium" });
    } else if (data.revenueTrend === "declining") {
      issues.push({ productId: pid, issue: "declining_trend", currentMetrics: { conversionRate: data.conversionRate, affiliatePayout: data.affiliatePayout, totalRevenue: data.totalRevenue, revenueTrend: data.revenueTrend }, suggestion: `${pid}: declining trend. Investigate niche page to retain segment.`, priority: "low" });
    }
  }
  return issues;
}

// ── Feedback evaluation (inline) ────────────────────────────────────────────

function evalFeedback(signals: GeoSignalsFile["signals"], pages: GeneratedPage[], existingState: ExpansionState["feedbackState"]) {
  const records: FeedbackRecord[] = pages.map((p) => {
    const sigs       = signals.filter((s) => s.category === p.slug);
    const sessions   = sigs.length;
    const convs      = sigs.filter((s) => s.convertedToQuiz).length;
    const convRate   = sessions > 0 ? convs / sessions : 0;
    const avgScroll  = sessions > 0 ? sigs.reduce((s, v) => s + v.scrollDepth, 0) / sessions : 0;
    const avgFaq     = sessions > 0 ? sigs.reduce((s, v) => s + v.faqInteractions, 0) / sessions : 0;
    const score      = Math.round(Math.min((convRate/0.20)*40 + (avgScroll/80)*25 + (avgFaq/2)*20 + (sessions/50)*15, 100));
    return { pageSlug: p.slug, generatedAt: p.createdAt, evaluatedAt: new Date().toISOString(), sessions, quizConversions: convs, conversionRate: convRate, avgScrollDepth: avgScroll, faqEngagement: avgFaq, expansionScore: score };
  });
  const combined = [...existingState.expansionRecords.filter((r) => !pages.map((p) => p.slug).includes(r.pageSlug)), ...records];
  const avg      = combined.length > 0 ? Math.round(combined.reduce((s, r) => s + r.expansionScore, 0) / combined.length) : 0;
  let threshold  = existingState.confidenceThreshold;
  if (avg >= 70 && threshold > 0.80) threshold = Math.max(threshold - 0.02, 0.80);
  if (avg < 40  && threshold < 0.95) threshold = Math.min(threshold + 0.02, 0.95);
  return { confidenceThreshold: threshold, expansionRecords: combined, avgExpansionScore: avg, lastEvaluated: new Date().toISOString() };
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN ORCHESTRATION
// ────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const runId    = `run-${Date.now()}`;
  const now      = new Date().toISOString();
  log(`Starting AEL build cycle — ${runId}`);

  // 1. Load existing data
  const existingPages = (readJson<{ pages: GeneratedPage[] }>(GENERATED_PAGES, { pages: [] })).pages;
  const existingCats  = (readJson<{ categories: GeneratedCategory[] }>(GENERATED_CATS, { categories: [] })).categories;
  const state         = readJson<ExpansionState>(EXPANSION_STATE, {
    lastRun: now, totalPagesGenerated: 0, totalCategoriesGenerated: 0,
    expansionHistory: [], currentOpportunities: [], revenueScans: [],
    feedbackState: { confidenceThreshold: 0.85, expansionRecords: [], avgExpansionScore: 0, lastEvaluated: now },
  });
  const revenue = readJson<RevenueModel>(REVENUE_MODEL, { products: {}, categories: {} });
  const intel   = readJson<IntelModel>(INTEL_MODEL, { products: {} });
  const signals = (readJson<GeoSignalsFile>(GEO_SIGNALS, { signals: [] })).signals;

  const threshold          = state.feedbackState.confidenceThreshold;
  const existingPageSlugs  = existingPages.map((p) => p.slug);
  const existingCategoryIds = existingCats.map((c) => c.id);

  log(`Loaded: ${existingPages.length} pages, ${existingCats.length} categories, ${signals.length} GEO signals`);

  // 2. Detect new intent pages
  const newPages: GeneratedPage[] = [];
  for (const intent of INTENT_VOCAB) {
    if (existingPageSlugs.includes(intent.slug)) continue;
    if (intent.confidence < threshold) continue;
    newPages.push({
      slug: intent.slug, title: intent.slug.replace(/-/g,"  ").replace(/\b\w/g,(l)=>l.toUpperCase()),
      h1: intent.slug.replace(/-/g," ").replace(/\b\w/g,(l)=>l.toUpperCase()),
      intent: intent.intent, category: intent.category,
      description: `Truth-calibrated ${intent.category} ranking for the ${intent.intent.replace(/_/g," ")} intent.`,
      productFilter: intent.productFilter, intentWeights: intent.intentWeights,
      geoKeywords: intent.geoKeywords, confidence: intent.confidence,
      createdAt: now, expansionOpportunityId: `opp-intent-${intent.slug}`,
    });
    log(`New page queued: ${intent.slug} (confidence ${intent.confidence})`);
  }

  // 3. Detect new categories (using laptops products as proxy — full product loading omitted for script simplicity)
  const newCategories: GeneratedCategory[] = [];
  for (const rule of CLUSTER_RULES) {
    if (existingCategoryIds.includes(rule.id)) continue;
    if (rule.confidence < threshold) continue;
    newCategories.push({
      id: rule.id, name: rule.name, description: rule.description,
      baseCategory: rule.baseCategory, productIds: [],
      filterCriteria: rule.filter, confidence: rule.confidence,
      createdAt: now, source: rule.source,
    });
    log(`New category queued: ${rule.id} (confidence ${rule.confidence})`);
  }

  // 4. Revenue scan
  const revenueScans = scanRevenue(revenue.products);
  log(`Revenue scan: ${revenueScans.length} issues found`);

  // 5. Build expansion opportunities list
  const opportunities: ExpansionOpportunity[] = [
    ...newPages.map((p) => ({
      id: p.expansionOpportunityId, type: "new_intent_page", name: p.slug,
      category: p.category, confidence: p.confidence,
      rationale: `Intent page gap detected. Confidence ${p.confidence}.`,
      estimatedImpact: p.confidence >= 0.90 ? "high" : "medium",
      createdAt: now, metadata: { intent: p.intent },
    })),
    ...newCategories.map((c) => ({
      id: `opp-cat-${c.id}`, type: "new_category", name: c.id,
      category: c.baseCategory, confidence: c.confidence,
      rationale: `Product cluster detected: ${c.description}`,
      estimatedImpact: c.confidence >= 0.90 ? "high" : "medium",
      createdAt: now, metadata: { source: c.source },
    })),
  ];

  // 6. Feedback loop evaluation
  const updatedFeedback = evalFeedback(signals, existingPages, state.feedbackState);
  log(`Feedback loop: avg expansion score ${updatedFeedback.avgExpansionScore}, threshold ${updatedFeedback.confidenceThreshold}`);

  // ── v4 PHASE: Intent Mining + Trigger Gate + Link Map ─────────────────────

  // 6a. Mine intents from raw event data
  const rawEvents = readJson<Event[]>(EVENTS_FILE, []);
  const minedIntents = mineIntents(rawEvents, existingPageSlugs);
  log(`v4: Mined ${minedIntents.length} intent(s) from ${rawEvents.length} event(s)`);

  // 6b. Merge with vocabulary intents (fills gaps when events are sparse)
  const vocabIntents = discoverIntents(existingPageSlugs);
  const mergedIntents = mergeWithVocabulary(minedIntents, vocabIntents, existingPageSlugs);
  log(`v4: Merged intent count: ${mergedIntents.length}`);

  // 6c. Discover categories from mined intents
  const v4Categories = discoverV4Categories(mergedIntents, existingCategoryIds);
  log(`v4: Category discovery: ${v4Categories.length} new cluster(s)`);

  // 6d. Evaluate expansion trigger — decides what to generate this run
  const trigger = evaluateExpansionTrigger(
    mergedIntents,
    v4Categories,
    existingPageSlugs,
    existingCategoryIds
  );
  log(`v4: Trigger — ${trigger.reason}`);

  // 6e. Generate page configs for trigger-approved intents (de-duplicate against v3 newPages)
  const v4NewPageConfigs: GeneratedPageConfig[] = [];
  if (trigger.shouldExpand) {
    for (const intent of trigger.approvedIntents) {
      const alreadyQueued = newPages.find((p) => p.slug === intent.slug);
      if (alreadyQueued) continue;
      const intentSignal: IntentSignal = {
        intent:              intent.key,
        slug:                intent.slug,
        category:            intent.category,
        searchVolume:        intent.frequency >= 10 ? "high" : intent.frequency >= 3 ? "medium" : "low",
        conversionPotential: intent.conversionRate >= 0.10 ? "high" : intent.conversionRate >= 0.05 ? "medium" : "low",
        hasPage:             false,
        priority:            Math.round(intent.confidence * 100),
        quizMapping:         intent.quizMapping,
      };
      const cfg = generatePageFromIntent(intentSignal, `opp-v4-${intent.key}-${runId}`);
      v4NewPageConfigs.push(cfg);
      log(`v4: + Generated page: /${cfg.slug} (intent: ${cfg.intent})`);
    }
  }

  // 6f. Build internal link map for all generated pages
  const existingLinkMap = readJson<Record<string, { quizHref: string; related: unknown[] }>>(LINK_MAP, {});
  const allKnownPageConfigs: GeneratedPageConfig[] = [
    ...existingPages.map((p) => p as unknown as GeneratedPageConfig),
    ...v4NewPageConfigs,
  ];
  const expandedLinks = buildExpandedLinks(v4NewPageConfigs, allKnownPageConfigs);
  const newLinkEntries = buildLinkMap(expandedLinks);
  const mergedLinkMap  = mergeLinkMaps(
    existingLinkMap as Parameters<typeof mergeLinkMaps>[0],
    newLinkEntries
  );
  log(`v4: Link map: ${Object.keys(newLinkEntries).length} new entries, ${Object.keys(mergedLinkMap).length} total`);

  // ── END v4 PHASE ──────────────────────────────────────────────────────────

  // 7. Merge and persist
  const allPages      = [...existingPages, ...newPages, ...v4NewPageConfigs];
  const allCategories = [...existingCats, ...newCategories];

  writeJson(GENERATED_PAGES, { pages: allPages });
  writeJson(GENERATED_CATS,  { categories: allCategories });
  writeJson(LINK_MAP,        mergedLinkMap);

  const newState: ExpansionState = {
    lastRun:                now,
    totalPagesGenerated:    allPages.length,
    totalCategoriesGenerated: allCategories.length,
    expansionHistory: [
      ...state.expansionHistory,
      {
        runId, timestamp: now,
        pagesAdded:            newPages.length,
        categoriesAdded:       newCategories.length,
        opportunitiesDetected: opportunities.length,
        confidenceThreshold:   threshold,
      },
    ],
    currentOpportunities: [...(state.currentOpportunities ?? []), ...opportunities],
    revenueScans,
    feedbackState: updatedFeedback,
  };

  writeJson(EXPANSION_STATE, newState);

  log(`AEL cycle complete. +${newPages.length + v4NewPageConfigs.length} pages (+${v4NewPageConfigs.length} v4), +${newCategories.length} categories.`);
  log(`Total: ${allPages.length} generated pages, ${allCategories.length} generated categories.`);
  log(`Revenue issues: ${revenueScans.length}. Confidence threshold: ${updatedFeedback.confidenceThreshold}`);
  log(`v4 trigger mode: ${trigger.mode} | Link map entries: ${Object.keys(mergedLinkMap).length}`);
}

main().catch((err) => { console.error("[AEL] Fatal error:", err); process.exit(1); });
