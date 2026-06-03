# DEN System Wiring Audit

**Date**: 2026-06-03
**Repository**: den-v1
**Method**: Static import graph analysis across all TypeScript/TSX source files

---

## Summary

| Metric | Count |
|--------|-------|
| **Total source files** | 125 |
| **WIRED** | 83 |
| **PARTIALLY_WIRED** | 15 |
| **UNUSED** | 27 |

---

## Classification Key

- **WIRED**: imported and executed at runtime by at least one active code path
- **PARTIALLY_WIRED**: exists in the import graph but only via type-only imports (erased at compile time), or exclusively in a build script (`npm run ael:build`), or reachable only via a function that is never called at runtime
- **UNUSED**: not imported by anything that executes at runtime

---

## APP LAYER (27 files — all WIRED)

These are Next.js route entry points. They are wired by definition.

---

### `app/layout.tsx`

- **Imported by**: Next.js framework (root layout)
- **Imports**: `globals.css`
- **Runtime path**: Every page render
- **Status**: WIRED

---

### `app/page.tsx`

- **Imported by**: Next.js router (`/`)
- **Imports**: `next/link`, `@/lib/category`
- **Runtime path**: Homepage render
- **Status**: WIRED

---

### `app/quiz/page.tsx`

- **Imported by**: Next.js router (`/quiz`)
- **Imports**: `@/lib/eventLogger`, `@/lib/segment`, `@/lib/category`
- **Runtime path**: Quiz flow (6-step, client-side)
- **Status**: WIRED

---

### `app/results/page.tsx`

- **Imported by**: Next.js router (`/results`)
- **Imports**: `@/lib/recommendByCategory`, `@/lib/eventLogger`, `@/lib/segment`, `@/lib/category`, `@/lib/compositeRanking`, `@/lib/learningEngine` (type), `@/lib/truthModel` (type), `@/lib/metrics/revenueMetrics` (type), `@/lib/compositeRanking`, `@/lib/learning/learningEngine`, `@/lib/session/sessionMemory`, `@/lib/analytics/liteAnalytics`
- **Runtime path**: Post-quiz recommendation display; affiliate CTA rendering
- **Status**: WIRED

---

### `app/admin/page.tsx`

- **Imported by**: Next.js router (`/admin`)
- **Imports**: `@/lib/eventLogger`, `@/lib/category`, `@/lib/globalMultiplier`, `@/lib/confidence`, `@/lib/v5/performanceTracker`, `@/lib/v6/opportunityDetector`, `@/lib/v6/strategyEngine`, `@/lib/v6/autonomousLoop` (loadDecisionLog only), `@/lib/v6/businessMemory`, `@/lib/v6/revenueControl`, `@/lib/v7/evolutionEngine`, `@/lib/v7/ecosystemOrchestrator`, `@/lib/v7/intelligenceNetwork`, `@/lib/v8/core/recursiveLoop`
- **Runtime path**: Admin dashboard; triggers v7 evolution tick and v8 economic tick on demand
- **Status**: WIRED

---

### `app/admin/ael/page.tsx`

- **Imported by**: Next.js router (`/admin/ael`)
- **Imports**: `@/lib/ael/expansionEngine` (type), `@/lib/ael/pageGenerator` (type), `@/lib/ael/categoryGenerator` (type), `@/lib/ael/revenueScanner` (type), `@/lib/ael/feedbackLoop` (type)
- **Runtime path**: AEL admin display — all imports are type-only; no AEL functions called at runtime
- **Status**: WIRED (page renders; AEL lib functions not executed)

---

### `app/admin/growth/page.tsx`

- **Imported by**: Next.js router (`/admin/growth`)
- **Imports**: `@/lib/metrics/revenueMetrics` (type), `@/lib/segmentRevenue`
- **Runtime path**: Revenue growth admin panel
- **Status**: WIRED

---

### `app/admin/growth/geo/page.tsx`

- **Imported by**: Next.js router (`/admin/growth/geo`)
- **Imports**: `@/lib/category`, `@/lib/geo/geoContentEngine`, `@/lib/geo/entityExtractor`, `@/lib/geo/geoScore`, `@/lib/geo/geoSignals` (type)
- **Runtime path**: GEO admin panel
- **Status**: WIRED

---

### `app/admin/growth/traffic/page.tsx`

- **Imported by**: Next.js router (`/admin/growth/traffic`)
- **Imports**: `@/lib/learning/eventAggregator` (type), `@/components/Analytics/FunnelChart`
- **Runtime path**: Traffic analytics admin panel
- **Status**: WIRED

---

### `app/sitemap.ts`

- **Imported by**: Next.js framework (generates `/sitemap.xml`)
- **Imports**: `@/lib/category`, `@/data/ael/generated-pages.json`
- **Runtime path**: Static generation at build time
- **Status**: WIRED

---

### `app/robots.ts`

- **Imported by**: Next.js framework (generates `/robots.txt`)
- **Imports**: `next` (MetadataRoute type only)
- **Runtime path**: Static generation at build time
- **Status**: WIRED

---

### `app/api/events/route.ts`

- **Imported by**: Client-side fetch calls from browser
- **Imports**: `@/lib/globalIntelligence`
- **Runtime path**: POST `/api/events` — merges browser tracking events into in-memory model
- **Status**: WIRED

---

### `app/api/events/batch/route.ts`

- **Imported by**: Client-side flush calls
- **Imports**: `@/lib/eventStore`, `@/lib/learningEngine`, `@/lib/truthModel`
- **Runtime path**: POST `/api/events/batch` — batch intelligence update; state is in-memory, resets on cold start
- **Status**: WIRED

---

### `app/api/outcomes/route.ts`

- **Imported by**: Client-side outcome reporting
- **Imports**: `@/lib/eventStore`, `@/lib/truthModel`
- **Runtime path**: POST/GET `/api/outcomes`
- **Status**: WIRED

---

### `app/api/truthModel/route.ts`

- **Imported by**: Admin panel polling
- **Imports**: `@/lib/eventStore`, `@/lib/truthModel`
- **Runtime path**: GET `/api/truthModel` — returns current truth model
- **Status**: WIRED

---

### `app/api/revenue/route.ts`

- **Imported by**: Revenue reporting calls
- **Imports**: `@/lib/revenueLearningLoop`
- **Runtime path**: POST `/api/revenue` — updates revenue model; `fs.writeFileSync` silently fails on Vercel
- **Status**: WIRED

---

### `app/api/geo/signals/route.ts`

- **Imported by**: `GeoSignalTracker` component (client-side POST)
- **Imports**: `@/lib/geo/geoSignals` (type only), `fs`, `path`
- **Runtime path**: POST `/api/geo/signals` — writes to `geoSignals.json`; silently fails on Vercel read-only FS
- **Status**: WIRED

---

### `app/api/ael/categories/route.ts`

- **Imported by**: Admin AEL panel polling
- **Imports**: `fs`, `path`
- **Runtime path**: GET `/api/ael/categories` — reads `data/ael/categories.json`
- **Status**: WIRED

---

### `app/api/ael/pages/route.ts`

- **Imported by**: Admin AEL panel polling
- **Imports**: `fs`, `path`
- **Runtime path**: GET `/api/ael/pages` — reads `data/ael/generated-pages.json`
- **Status**: WIRED

---

### `app/api/ael/state/route.ts`

- **Imported by**: Admin AEL panel polling
- **Imports**: `fs`, `path`
- **Runtime path**: GET `/api/ael/state` — reads `data/ael/state.json`
- **Status**: WIRED

---

### `app/(landing)/[slug]/page.tsx`

- **Imported by**: Next.js router (dynamic category landing pages)
- **Imports**: `@/lib/category`, `@/lib/geo/geoContentEngine`, `@/lib/geo/entityExtractor`, `@/lib/geo/schemaGenerator`, `@/lib/geo/geoScore`, `@/components/geo/GeoSignalTracker`
- **Runtime path**: SSG for each category slug; GEO content generation at build time
- **Status**: WIRED

---

### `app/(landing)/best-laptops-for-gaming/page.tsx`

- **Imported by**: Next.js router
- **Imports**: `@/data/products.json`, `@/components/landing/TrafficLandingTemplate`, `@/lib/seo/metaBuilder`, `@/lib/geo/schemaGenerator`, `@/lib/seo/internalLinks`
- **Runtime path**: SSG at build time
- **Status**: WIRED

---

### `app/(landing)/best-laptops-for-students/page.tsx`

- **Imported by**: Next.js router
- **Imports**: same pattern as gaming page
- **Runtime path**: SSG at build time
- **Status**: WIRED

---

### `app/(landing)/best-budget-laptops/page.tsx`

- **Imported by**: Next.js router
- **Imports**: same pattern
- **Status**: WIRED

---

### `app/(landing)/laptops-for-coding/page.tsx`

- **Imported by**: Next.js router
- **Imports**: same pattern
- **Status**: WIRED

---

### `app/(landing)/work-from-home-laptops/page.tsx`

- **Imported by**: Next.js router
- **Imports**: same pattern
- **Status**: WIRED

---

### `app/(landing)/generated/[slug]/page.tsx`

- **Imported by**: Next.js router (AEL-generated pages)
- **Imports**: `@/lib/category`, `@/lib/ael/enrichmentPipeline`, `@/lib/ael/pageGenerator` (type), `@/lib/seo/internalLinks` (type), `@/components/geo/GeoSignalTracker`, `@/data/ael/generated-pages.json`, `@/data/ael/link-map.json`
- **Runtime path**: SSG for AEL-generated page slugs
- **Status**: WIRED

---

## COMPONENTS (10 files)

---

### `components/geo/GeoSignalTracker.tsx`

- **Imported by**: `app/(landing)/[slug]/page.tsx`, `app/(landing)/generated/[slug]/page.tsx`
- **Imports**: `react`, local GEO signal POST logic
- **Runtime path**: Client component; fires POST to `/api/geo/signals` on page load
- **Status**: WIRED

---

### `components/landing/TrafficLandingTemplate.tsx`

- **Imported by**: All 5 static landing pages (`best-laptops-for-*`, `laptops-for-coding`, `work-from-home-laptops`)
- **Imports**: `next/link`, `@/types/product`, `@/lib/seo/internalLinks` (type)
- **Runtime path**: Renders product listing + FAQ structure for all traffic landing pages
- **Status**: WIRED

---

### `components/Analytics/FunnelChart.tsx`

- **Imported by**: `app/admin/growth/traffic/page.tsx`
- **Imports**: `@/lib/learning/eventAggregator` (type only)
- **Runtime path**: Admin traffic panel; renders funnel visualisation using data passed as props
- **Status**: WIRED

---

### `components/Analytics/RevenueTable.tsx`

- **Imported by**: nothing
- **Imports**: (unknown — not traced, no importer)
- **Runtime path**: None
- **Status**: UNUSED

---

### `components/Product/ProductCard.tsx`

- **Imported by**: nothing in app layer
- **Imports**: `@/types/product`, `./ProductScoreBar`, `./RevenueBadge`
- **Runtime path**: None. Results page renders product data directly without this component.
- **Status**: UNUSED

---

### `components/Product/ProductScoreBar.tsx`

- **Imported by**: `components/Product/ProductCard.tsx` (which is itself UNUSED)
- **Imports**: none from project
- **Runtime path**: None
- **Status**: UNUSED

---

### `components/Product/RevenueBadge.tsx`

- **Imported by**: `components/Product/ProductCard.tsx` (which is itself UNUSED)
- **Imports**: none from project
- **Runtime path**: None
- **Status**: UNUSED

---

### `components/Layout/Header.tsx`

- **Imported by**: nothing
- **Imports**: `next/link`
- **Runtime path**: None. All pages inline their own header markup.
- **Status**: UNUSED

---

### `components/Layout/Footer.tsx`

- **Imported by**: nothing
- **Imports**: `next/link`
- **Runtime path**: None. All pages inline their own footer markup.
- **Status**: UNUSED

---

### `components/geo/GeoBlock.tsx`

- **Imported by**: nothing
- **Imports**: `next/link`, `@/lib/seo/internalLinks` (type)
- **Runtime path**: None
- **Status**: UNUSED

---

## LIB LAYER — ROOT (25 files)

---

### `lib/engine.ts`

- **Imported by**: nothing
- **Imports**: `@/data/logic.json`
- **Runtime path**: None. This is the v1 rule-based engine (`logic.json` + `if/budget/purpose` rules). Superseded entirely by the scoring pipeline.
- **Status**: UNUSED — v1 dead code

---

### `lib/tracker.ts`

- **Imported by**: `lib/events.ts` (which is itself UNUSED)
- **Imports**: `@/types/product`
- **Runtime path**: None. Only consumer is unused.
- **Status**: UNUSED — v1 dead code

---

### `lib/events.ts`

- **Imported by**: nothing
- **Imports**: `./tracker`
- **Runtime path**: None. `syncEvents()` is defined but never called.
- **Status**: UNUSED — v1 dead code

---

### `lib/eventLogger.ts`

- **Imported by**: `app/quiz/page.tsx`, `app/results/page.tsx`, `app/admin/page.tsx`, `lib/events/eventLogger.ts`
- **Imports**: `@/types/event`, `./segment`
- **Runtime path**: Quiz events → results page flush → admin display. Core event pipeline.
- **Status**: WIRED

---

### `lib/eventStore.ts`

- **Imported by**: `app/api/events/batch/route.ts`, `app/api/outcomes/route.ts`, `app/api/truthModel/route.ts`
- **Imports**: `@/types/event`
- **Runtime path**: Server-side event append/read for truth model and outcome APIs
- **Status**: WIRED

---

### `lib/globalIntelligence.ts`

- **Imported by**: `app/api/events/route.ts`
- **Imports**: `@/data/globalModel.json`, `@/types/product`
- **Runtime path**: POST `/api/events` merges incoming events into global model (in-memory)
- **Status**: WIRED

---

### `lib/segment.ts`

- **Imported by**: `lib/eventLogger.ts`, `app/quiz/page.tsx`, `app/results/page.tsx`, `lib/revenueEngine.ts`, `lib/scoring.ts`, `lib/seo/intentMap.ts`, `lib/revenue/revenueEngine.ts`
- **Imports**: `@/types/event`
- **Runtime path**: `detectSegment()` called throughout quiz and results flow to classify user intent
- **Status**: WIRED

---

### `lib/learningEngine.ts`

- **Imported by**: `app/api/events/batch/route.ts` (concrete), `app/results/page.tsx` (type), `app/admin/page.tsx` (type), `lib/scoring.ts` (type), `lib/recommendByCategory.ts` (type), `lib/globalMultiplier.ts`
- **Imports**: `./timeDecay`, `./segment`
- **Runtime path**: Batch event processing in API; type-only in client pages
- **Status**: WIRED

---

### `lib/truthModel.ts`

- **Imported by**: `app/api/events/batch/route.ts`, `app/api/outcomes/route.ts`, `app/api/truthModel/route.ts`, `app/results/page.tsx` (type), `app/admin/page.tsx` (type), `lib/scoring.ts` (type), `lib/recommendByCategory.ts` (type), `lib/truth/truthEngine.ts`
- **Imports**: `./outcomeEngine`, `./biasCorrection`, `./confidence`
- **Runtime path**: Truth model build/merge runs in 3 API routes
- **Status**: WIRED

---

### `lib/scoring.ts`

- **Imported by**: `lib/recommendByCategory.ts`
- **Imports**: `@/types/product`, `./learningEngine` (type), `./truthModel` (type), `./globalMultiplier`, `./segment`
- **Runtime path**: `calculateScore()` called for every product during results page ranking
- **Status**: WIRED

---

### `lib/recommendByCategory.ts`

- **Imported by**: `app/results/page.tsx`, `lib/recommend.ts` (UNUSED)
- **Imports**: `./category`, `./scoring`, `./feedback`, `./learning`
- **Runtime path**: Core recommendation function; called directly by results page
- **Status**: WIRED

---

### `lib/recommend.ts`

- **Imported by**: nothing
- **Imports**: `./recommendByCategory`, `@/types/product`
- **Runtime path**: None. Wraps `getRecommendations()` but no caller exists. Results page imports `recommendByCategory` directly.
- **Status**: UNUSED — dead wrapper

---

### `lib/compositeRanking.ts`

- **Imported by**: `app/results/page.tsx`
- **Imports**: `@/types/product`, `./metrics/revenueMetrics` (type), `./revenueEngine`
- **Runtime path**: `applyCompositeRanking()` re-ranks products by revenue score on results page
- **Status**: WIRED

---

### `lib/feedback.ts`

- **Imported by**: `lib/recommendByCategory.ts`
- **Imports**: `@/types/product`
- **Runtime path**: `getProductFeedback()` applied during recommendation scoring
- **Status**: WIRED

---

### `lib/learning.ts`

- **Imported by**: `lib/recommendByCategory.ts`
- **Imports**: `@/types/product`
- **Runtime path**: `updateProductWeights()` applied during recommendation scoring
- **Status**: WIRED

---

### `lib/category.ts`

- **Imported by**: `app/page.tsx`, `app/sitemap.ts`, `app/quiz/page.tsx`, `app/results/page.tsx`, `app/admin/page.tsx`, `app/(landing)/[slug]/page.tsx`, `app/(landing)/generated/[slug]/page.tsx`, all 5 static landing pages, `app/admin/growth/geo/page.tsx`, `lib/recommendByCategory.ts`
- **Imports**: `@/data/categories/*.json` (5 category JSON files), `@/types/product`
- **Runtime path**: Most-imported lib file; provides category config throughout the entire app
- **Status**: WIRED

---

### `lib/revenueEngine.ts`

- **Imported by**: `lib/compositeRanking.ts`, `lib/revenue/revenueEngine.ts`
- **Imports**: `@/types/product`, `./metrics/revenueMetrics` (type), `./segmentRevenue`, `./trafficWeights`, `./segment`
- **Runtime path**: `calculateRevenueScore()` called during composite ranking on results page
- **Status**: WIRED

---

### `lib/segmentRevenue.ts`

- **Imported by**: `lib/revenueEngine.ts`, `app/admin/growth/page.tsx`
- **Imports**: `@/types/event`
- **Runtime path**: Revenue multiplier lookup during composite ranking and admin revenue display
- **Status**: WIRED

---

### `lib/trafficWeights.ts`

- **Imported by**: `lib/revenueEngine.ts`
- **Imports**: (none from project)
- **Runtime path**: Traffic weight lookup during revenue scoring
- **Status**: WIRED

---

### `lib/timeDecay.ts`

- **Imported by**: `lib/learningEngine.ts`, `lib/outcomeEngine.ts`, `lib/learning/eventAggregator.ts`
- **Imports**: (none from project)
- **Runtime path**: Decay functions applied in learning engine (API batch route) and outcome engine
- **Status**: WIRED

---

### `lib/outcomeEngine.ts`

- **Imported by**: `lib/truthModel.ts`
- **Imports**: `./timeDecay`
- **Runtime path**: `evaluateOutcome()` called during truth model construction in API routes
- **Status**: WIRED

---

### `lib/biasCorrection.ts`

- **Imported by**: `lib/truthModel.ts`
- **Imports**: `@/types/event`
- **Runtime path**: `correctBias()` called during truth model construction
- **Status**: WIRED

---

### `lib/confidence.ts`

- **Imported by**: `lib/truthModel.ts`, `app/admin/page.tsx`
- **Imports**: (none from project)
- **Runtime path**: `getConfidenceWeight()` used in truth model and admin display
- **Status**: WIRED

---

### `lib/globalMultiplier.ts`

- **Imported by**: `lib/scoring.ts`, `lib/truth/truthEngine.ts`, `app/admin/page.tsx`
- **Imports**: `./learningEngine` (type)
- **Runtime path**: `ctrToMultiplier()`, `truthScoreToMultiplier()` applied during product scoring
- **Status**: WIRED

---

### `lib/revenueLearningLoop.ts`

- **Imported by**: `app/api/revenue/route.ts`
- **Imports**: `@/types/event`, `./metrics/revenueMetrics` (type), `fs`, `path`
- **Runtime path**: Revenue model update in POST `/api/revenue`; `fs.writeFileSync` silently fails on Vercel
- **Status**: WIRED

---

## LIB/METRICS (1 file)

---

### `lib/metrics/revenueMetrics.ts`

- **Imported by**: `lib/revenueLearningLoop.ts` (type), `lib/compositeRanking.ts` (type), `lib/revenueEngine.ts` (type), `lib/ael/expansionEngine.ts` (type), `lib/ael/revenueScanner.ts` (type), `app/results/page.tsx` (type), `app/api/revenue/route.ts` (type), `app/admin/growth/page.tsx` (type), `lib/revenue/revenueEngine.ts` (type)
- **Imports**: `@/types/event`
- **Runtime path**: Type definitions consumed throughout revenue pipeline; `RevenueModelSnapshot` shape drives revenue API
- **Status**: WIRED

---

## LIB/EVENTS (2 files — both UNUSED)

---

### `lib/events/eventLogger.ts`

- **Imported by**: nothing
- **Imports**: `@/lib/eventLogger` (root version)
- **Runtime path**: None. This is a subdirectory wrapper around the root `lib/eventLogger.ts`. Nothing imports the subdirectory version. Dead duplicate.
- **Status**: UNUSED

---

### `lib/events/eventTypes.ts`

- **Imported by**: nothing
- **Imports**: `@/types/event`
- **Runtime path**: None. Type definitions duplicated here are consumed directly from `@/types/event` everywhere.
- **Status**: UNUSED

---

## LIB/SCORING (2 files — both UNUSED)

---

### `lib/scoring/basicScoring.ts`

- **Imported by**: nothing
- **Imports**: `@/types/product`
- **Runtime path**: None. Root `lib/scoring.ts` is used instead.
- **Status**: UNUSED — shadowed by root `lib/scoring.ts`

---

### `lib/scoring/compositeScoring.ts`

- **Imported by**: nothing
- **Imports**: (unknown)
- **Runtime path**: None. Root `lib/compositeRanking.ts` is used instead.
- **Status**: UNUSED — shadowed by root `lib/compositeRanking.ts`

---

## LIB/REVENUE (2 files — both UNUSED)

---

### `lib/revenue/revenueEngine.ts`

- **Imported by**: nothing in app layer
- **Imports**: `@/types/product`, `@/lib/metrics/revenueMetrics` (type), `@/lib/revenueEngine`, `@/lib/segment`
- **Runtime path**: None. This is a subdirectory duplicate that re-exports from root `lib/revenueEngine.ts`. Nothing imports it.
- **Status**: UNUSED — duplicate of root `lib/revenueEngine.ts`

---

### `lib/revenue/trafficValue.ts`

- **Imported by**: nothing
- **Imports**: `@/lib/traffic/trafficSource` (type)
- **Runtime path**: None.
- **Status**: UNUSED

---

## LIB/TRUTH (1 file — UNUSED)

---

### `lib/truth/truthEngine.ts`

- **Imported by**: nothing in app layer
- **Imports**: `@/lib/truthModel`, `@/lib/globalMultiplier`
- **Runtime path**: None. Root `lib/truthModel.ts` is used directly. This subdirectory version is never called.
- **Status**: UNUSED — duplicate of root `lib/truthModel.ts`

---

## LIB/SESSION (1 file)

---

### `lib/session/sessionMemory.ts`

- **Imported by**: `app/results/page.tsx`
- **Imports**: `@/types/product`
- **Runtime path**: `getSession()`, `saveQuizAnswers()`, `recordProductView()`, `recordAffiliateClick()`, `sessionToSignalEvents()` — all called on results page load
- **Status**: WIRED

---

## LIB/ANALYTICS (1 file)

---

### `lib/analytics/liteAnalytics.ts`

- **Imported by**: `app/results/page.tsx`
- **Imports**: (none from project)
- **Runtime path**: `trackImpression()`, `trackAffiliateClick()`, `trackResultView()`, `getBehaviorProfile()` — all called on results page
- **Status**: WIRED

---

## LIB/UTILS (1 file — UNUSED)

---

### `lib/utils/helpers.ts`

- **Imported by**: nothing
- **Imports**: (unknown)
- **Runtime path**: None.
- **Status**: UNUSED

---

## LIB/TRAFFIC (1 file — UNUSED)

---

### `lib/traffic/trafficSource.ts`

- **Imported by**: `lib/revenue/trafficValue.ts` (which is itself UNUSED)
- **Imports**: (none from project)
- **Runtime path**: None. Only consumer is dead code.
- **Status**: UNUSED

---

## LIB/LEARNING (2 files)

---

### `lib/learning/learningEngine.ts`

- **Imported by**: `app/results/page.tsx`
- **Imports**: `@/types/event`, `@/types/product`
- **Runtime path**: `computeAdjustmentMap()`, `applyBehaviourAdjustment()` called on results page to apply behaviour bias to recommendations
- **Status**: WIRED

---

### `lib/learning/eventAggregator.ts`

- **Imported by**: `app/admin/growth/traffic/page.tsx` (type only), `components/Analytics/FunnelChart.tsx` (type only)
- **Imports**: `@/types/event`, `@/lib/timeDecay`
- **Runtime path**: `FunnelMetrics` and `AggregatedIntelligence` types are referenced but no functions are called. The aggregator is never instantiated at runtime.
- **Status**: PARTIALLY_WIRED — types used, functions never called

---

## LIB/SEO (3 files)

---

### `lib/seo/metaBuilder.ts`

- **Imported by**: All 5 static landing pages
- **Imports**: `next` (Metadata type)
- **Runtime path**: `buildMeta()` generates OG/Twitter/canonical metadata at SSG build time for all landing pages
- **Status**: WIRED

---

### `lib/seo/internalLinks.ts`

- **Imported by**: All 5 static landing pages, `app/(landing)/generated/[slug]/page.tsx` (type), `components/geo/GeoBlock.tsx` (type), `components/landing/TrafficLandingTemplate.tsx` (type)
- **Imports**: (none from project)
- **Runtime path**: `getRelatedPages()`, `getQuizHref()` called during SSG on all landing pages
- **Status**: WIRED

---

### `lib/seo/intentMap.ts`

- **Imported by**: nothing
- **Imports**: `@/types/product`, `@/types/event`, `@/lib/segment`
- **Runtime path**: None. Intent-to-page mapping is defined but never consumed.
- **Status**: UNUSED

---

## LIB/GEO (6 files)

---

### `lib/geo/geoContentEngine.ts`

- **Imported by**: `app/(landing)/[slug]/page.tsx`, `app/admin/growth/geo/page.tsx`, `lib/ael/enrichmentPipeline.ts`, `lib/geo/geoEngine.ts`
- **Imports**: `@/types/product`
- **Runtime path**: `generateGeoContent()` called at SSG build time for dynamic landing pages; called at runtime in admin GEO panel
- **Status**: WIRED

---

### `lib/geo/entityExtractor.ts`

- **Imported by**: `app/(landing)/[slug]/page.tsx`, `app/admin/growth/geo/page.tsx`, `lib/geo/geoScore.ts`, `lib/geo/geoEngine.ts`
- **Imports**: `@/types/product`
- **Runtime path**: `extractEntities()`, `extractEntityLabels()` called during landing page SSG
- **Status**: WIRED

---

### `lib/geo/geoScore.ts`

- **Imported by**: `app/(landing)/[slug]/page.tsx`, `app/admin/growth/geo/page.tsx`, `lib/ael/enrichmentPipeline.ts`, `lib/geo/geoEngine.ts`
- **Imports**: `./geoContentEngine` (type), `./entityExtractor`
- **Runtime path**: `evaluatePageGeoScore()` called during landing page SSG and admin GEO panel
- **Status**: WIRED

---

### `lib/geo/schemaGenerator.ts`

- **Imported by**: `app/(landing)/[slug]/page.tsx`, all 5 static landing pages
- **Imports**: `@/types/product`
- **Runtime path**: Schema markup generation (JSON-LD) at SSG build time
- **Status**: WIRED

---

### `lib/geo/geoSignals.ts`

- **Imported by**: `app/api/geo/signals/route.ts` (type only), `app/admin/growth/geo/page.tsx` (type only), `lib/ael/feedbackLoop.ts` (type only)
- **Imports**: (none from project)
- **Runtime path**: `GeoSignal` type is referenced in the API route and admin, but the exported functions (if any) are never called. The actual signal data is read/written via raw `fs` operations in the API route.
- **Status**: PARTIALLY_WIRED — type used, functions not called at runtime

---

### `lib/geo/geoEngine.ts`

- **Imported by**: nothing
- **Imports**: `@/types/product`, `./geoContentEngine`, `./entityExtractor`, `./geoScore`, `./geoSignals`
- **Runtime path**: None. This is a unified facade over the individual GEO modules. Each module is imported directly by pages instead. The `geoEngine.ts` doc comment even shows example usage that is never wired up.
- **Status**: UNUSED — unified facade never connected to any page or API

---

## LIB/AEL (13 files)

---

### `lib/ael/enrichmentPipeline.ts`

- **Imported by**: `app/(landing)/generated/[slug]/page.tsx`
- **Imports**: `@/types/product`, `./pageGenerator` (type), `@/lib/geo/geoContentEngine` (type), `./geoScore`, `./geoContentEngine`, `@/lib/geo/geoScore`, `@/lib/geo/geoContentEngine`
- **Runtime path**: `filterProductsForPage()`, `enrichPage()` called at SSG for AEL-generated pages
- **Status**: WIRED

---

### `lib/ael/pageGenerator.ts`

- **Imported by**: `lib/ael/enrichmentPipeline.ts`, `app/(landing)/generated/[slug]/page.tsx` (type), `app/admin/ael/page.tsx` (type)
- **Imports**: `@/types/product`, `./expansionEngine` (type), `./intentDiscovery` (type)
- **Runtime path**: `GeneratedPageConfig` type drives AEL page rendering; page generation functions invoked via enrichmentPipeline
- **Status**: WIRED

---

### `lib/ael/expansionEngine.ts`

- **Imported by**: `app/admin/ael/page.tsx` (type only), `lib/ael/pageGenerator.ts` (type only)
- **Imports**: `@/lib/metrics/revenueMetrics` (type), `@/types/product`
- **Runtime path**: `ExpansionOpportunity` type consumed in admin display; no expansion functions called at runtime
- **Status**: PARTIALLY_WIRED — type-only consumption

---

### `lib/ael/categoryGenerator.ts`

- **Imported by**: `app/admin/ael/page.tsx` (type only)
- **Imports**: `@/types/product`
- **Runtime path**: `GeneratedCategory` type used in admin AEL panel display only
- **Status**: PARTIALLY_WIRED — type-only consumption

---

### `lib/ael/intentDiscovery.ts`

- **Imported by**: `lib/ael/pageGenerator.ts` (type only)
- **Imports**: `@/types/product`
- **Runtime path**: `IntentSignal` type referenced in pageGenerator's type signatures only
- **Status**: PARTIALLY_WIRED — type-only consumption

---

### `lib/ael/feedbackLoop.ts`

- **Imported by**: `app/admin/ael/page.tsx` (type only)
- **Imports**: `@/lib/geo/geoSignals` (type)
- **Runtime path**: `FeedbackRecord` type used in admin AEL panel display only
- **Status**: PARTIALLY_WIRED — type-only consumption

---

### `lib/ael/revenueScanner.ts`

- **Imported by**: `app/admin/ael/page.tsx` (type only)
- **Imports**: `@/lib/metrics/revenueMetrics` (type)
- **Runtime path**: `RevenueScanResult` type used in admin AEL panel display only
- **Status**: PARTIALLY_WIRED — type-only consumption

---

### `lib/ael/aelGate.ts`

- **Imported by**: nothing
- **Imports**: `@/lib/learning/eventAggregator` (type)
- **Runtime path**: None. Defines unlock conditions for autonomous expansion (100 sessions / 20 affiliate clicks / 1 conversion), but is never evaluated at runtime. The AEL expansion is never gated by this logic.
- **Status**: UNUSED

---

### `lib/ael/intentMiningEngine.ts`

- **Imported by**: `scripts/ael-build.ts` (build script only), `lib/ael/expansionTrigger.ts` (type), `lib/ael/categoryDiscoveryEngine.ts` (type)
- **Imports**: `@/types/event`, `@/types/product`
- **Runtime path**: Only executed when `npm run ael:build` is run manually. Not part of the runtime Next.js app.
- **Status**: PARTIALLY_WIRED — build-script-only execution

---

### `lib/ael/categoryDiscoveryEngine.ts`

- **Imported by**: `scripts/ael-build.ts`, `lib/ael/expansionTrigger.ts` (type)
- **Imports**: `./intentMiningEngine` (type), `@/types/product`
- **Runtime path**: Build script only
- **Status**: PARTIALLY_WIRED — build-script-only execution

---

### `lib/ael/contentTemplates.ts`

- **Imported by**: nothing
- **Imports**: (unknown)
- **Runtime path**: None. Described as "v4 Content Templates" — never consumed by any page, API, or build script.
- **Status**: UNUSED

---

### `lib/ael/internalLinkExpansion.ts`

- **Imported by**: `scripts/ael-build.ts`
- **Imports**: `@/lib/seo/internalLinks` (type), `./pageGenerator` (type)
- **Runtime path**: Build script only — generates `data/ael/link-map.json`
- **Status**: PARTIALLY_WIRED — build-script-only execution

---

### `lib/ael/expansionTrigger.ts`

- **Imported by**: `scripts/ael-build.ts`
- **Imports**: `./intentMiningEngine` (type), `./categoryDiscoveryEngine` (type)
- **Runtime path**: Build script only — evaluates whether AEL expansion should run
- **Status**: PARTIALLY_WIRED — build-script-only execution

---

## LIB/V5 (6 files)

---

### `lib/v5/variantEngine.ts`

- **Imported by**: `lib/v5/revenueSimulator.ts`, `lib/v5/testOrchestrator.ts`, `lib/v5/performanceTracker.ts`, `lib/v5/feedbackLoop.ts`, `lib/v5/weightOptimizer.ts`, `lib/v6/opportunityDetector.ts` (type), `lib/v6/revenueControl.ts`, `lib/v7/strategyTransfer.ts`
- **Imports**: `@/types/product`
- **Runtime path**: Variant profiles and weight normalisation consumed by v6 revenue control (loaded by admin). Core v5 types flow into v6/v7.
- **Status**: WIRED

---

### `lib/v5/revenueSimulator.ts`

- **Imported by**: nothing
- **Imports**: `./variantEngine`
- **Runtime path**: None. `simulateVariantRevenue()`, `simulateAllVariants()`, `getBestRevenueVariant()` are defined but never called from the admin panel or any other file.
- **Status**: UNUSED

---

### `lib/v5/weightOptimizer.ts`

- **Imported by**: `lib/v5/feedbackLoop.ts` (which is itself UNUSED)
- **Imports**: `./variantEngine`
- **Runtime path**: None. Only consumer is unused.
- **Status**: PARTIALLY_WIRED — in a dead chain

---

### `lib/v5/performanceTracker.ts`

- **Imported by**: `app/admin/page.tsx` (loadPerformanceStore), `lib/v5/feedbackLoop.ts`, `lib/v6/autonomousLoop.ts` (type), `lib/v6/opportunityDetector.ts` (type)
- **Imports**: `./variantEngine`
- **Runtime path**: `loadPerformanceStore()` called by admin page on load; performance data read from localStorage
- **Status**: WIRED

---

### `lib/v5/feedbackLoop.ts`

- **Imported by**: nothing
- **Imports**: `./variantEngine`, `./weightOptimizer`, `./performanceTracker`
- **Runtime path**: None. `runFeedbackLoop()` and `registerSessionEndHandler()` are defined but never called.
- **Status**: UNUSED

---

### `lib/v5/testOrchestrator.ts`

- **Imported by**: nothing
- **Imports**: `./variantEngine`
- **Runtime path**: None. `assignVariant()`, `resolveVariantAssignment()` are defined but never called. A/B/C/D variant assignment is implemented but never triggered from any page.
- **Status**: UNUSED

---

## LIB/V6 (7 files)

---

### `lib/v6/opportunityDetector.ts`

- **Imported by**: `app/admin/page.tsx` (detectOpportunities, summariseOpportunities), `lib/v6/autonomousLoop.ts`, `lib/v7/nodeGenerator.ts` (type), `lib/v7/evolutionEngine.ts` (type)
- **Imports**: `@/lib/v5/variantEngine` (type), `@/lib/v5/performanceTracker` (type)
- **Runtime path**: `detectOpportunities()` called in admin on every render to show current opportunities
- **Status**: WIRED

---

### `lib/v6/strategyEngine.ts`

- **Imported by**: `app/admin/page.tsx` (generateStrategies, deduplicateStrategies), `lib/v6/autonomousLoop.ts`, `lib/v6/marketingEngine.ts` (type), `lib/v6/businessRules.ts` (type), `lib/v6/revenueControl.ts` (type), `lib/v6/businessMemory.ts` (type)
- **Imports**: `./opportunityDetector`
- **Runtime path**: `generateStrategies()` called in admin panel to display current strategy recommendations
- **Status**: WIRED

---

### `lib/v6/marketingEngine.ts`

- **Imported by**: `lib/v6/autonomousLoop.ts`
- **Imports**: `./opportunityDetector` (type), `./strategyEngine` (type)
- **Runtime path**: `runMarketingEngine()` is called inside `runAutonomousLoop()`, which is never called from the admin panel. Only `loadDecisionLog()` is called, not `runAutonomousLoop()`. Therefore marketingEngine never executes at runtime.
- **Status**: PARTIALLY_WIRED — reachable only via uncalled `runAutonomousLoop()`

---

### `lib/v6/businessMemory.ts`

- **Imported by**: `app/admin/page.tsx` (loadMemory), `lib/v6/autonomousLoop.ts`, `lib/v7/nodeGenerator.ts` (type), `lib/v7/evolutionEngine.ts` (type), `lib/v6/businessRules.ts` (type)
- **Imports**: `./strategyEngine` (type)
- **Runtime path**: `loadMemory()` called by admin panel to display memory state
- **Status**: WIRED

---

### `lib/v6/revenueControl.ts`

- **Imported by**: `app/admin/page.tsx` (loadRevenueControlState), `lib/v6/autonomousLoop.ts`
- **Imports**: `@/lib/v5/variantEngine`, `./strategyEngine` (type)
- **Runtime path**: `loadRevenueControlState()` called by admin panel
- **Status**: WIRED

---

### `lib/v6/businessRules.ts`

- **Imported by**: `lib/v6/autonomousLoop.ts`
- **Imports**: `./opportunityDetector` (type), `./strategyEngine` (type), `./businessMemory` (type), `./revenueControl` (type)
- **Runtime path**: `runBusinessRules()` only called inside `runAutonomousLoop()`, which is never triggered. Never executes at runtime.
- **Status**: PARTIALLY_WIRED — reachable only via uncalled `runAutonomousLoop()`

---

### `lib/v6/autonomousLoop.ts`

- **Imported by**: `app/admin/page.tsx` (loadDecisionLog only)
- **Imports**: `./opportunityDetector`, `./strategyEngine`, `./marketingEngine`, `./revenueControl`, `./businessRules`, `@/lib/v5/performanceTracker` (type)
- **Runtime path**: `loadDecisionLog()` is called by admin panel. `runAutonomousLoop()` is never called from the admin panel or any other entry point — the autonomous operator never actually runs.
- **Status**: PARTIALLY_WIRED — `loadDecisionLog()` wired; `runAutonomousLoop()` dead

---

## LIB/V7 (7 files — all WIRED)

---

### `lib/v7/ecosystemOrchestrator.ts`

- **Imported by**: `app/admin/page.tsx` (rankNodes), `lib/v7/evolutionEngine.ts`, `lib/v7/deploymentSimulator.ts` (type), `lib/v7/globalSelection.ts` (type), `lib/v7/nodeGenerator.ts` (type), `lib/v7/strategyTransfer.ts` (type), `lib/v8/agents/economicAgent.ts` (type), `lib/v8/core/recursiveLoop.ts`
- **Imports**: (none from project beyond types)
- **Runtime path**: `loadEcosystem()` / `saveEcosystem()` called by recursiveLoop (v8) and evolutionEngine; `rankNodes()` called by admin panel
- **Status**: WIRED

---

### `lib/v7/nodeGenerator.ts`

- **Imported by**: `lib/v7/evolutionEngine.ts`
- **Imports**: `./ecosystemOrchestrator` (type), `@/lib/v6/opportunityDetector` (type), `@/lib/v6/businessMemory` (type)
- **Runtime path**: `generateCandidateNodes()` called inside `runEvolutionTick()`, which is triggered from admin panel
- **Status**: WIRED

---

### `lib/v7/strategyTransfer.ts`

- **Imported by**: `lib/v7/evolutionEngine.ts`
- **Imports**: `./ecosystemOrchestrator` (type), `@/lib/v5/variantEngine` (type), `@/lib/v5/variantEngine`
- **Runtime path**: `propagateTopStrategy()` called inside `runEvolutionTick()`
- **Status**: WIRED

---

### `lib/v7/intelligenceNetwork.ts`

- **Imported by**: `app/admin/page.tsx` (getTopIntents, getTopRevenueCategories), `lib/v7/evolutionEngine.ts`
- **Imports**: (none from project beyond localStorage)
- **Runtime path**: `getTopIntents()`, `getTopRevenueCategories()` called by admin panel; network updated during evolution tick
- **Status**: WIRED

---

### `lib/v7/deploymentSimulator.ts`

- **Imported by**: `lib/v7/evolutionEngine.ts`, `lib/v7/globalSelection.ts` (type)
- **Imports**: `./ecosystemOrchestrator` (type)
- **Runtime path**: `simulateEcosystem()`, `applySimulationToNodes()` called inside `runEvolutionTick()`
- **Status**: WIRED

---

### `lib/v7/globalSelection.ts`

- **Imported by**: `lib/v7/evolutionEngine.ts`
- **Imports**: `./ecosystemOrchestrator` (type), `./deploymentSimulator` (type)
- **Runtime path**: `runGlobalSelection()`, `getTopNodeIds()` called inside `runEvolutionTick()`
- **Status**: WIRED

---

### `lib/v7/evolutionEngine.ts`

- **Imported by**: `app/admin/page.tsx` (getEcosystemSnapshot, runEvolutionTick)
- **Imports**: `@/lib/v6/opportunityDetector` (type), `@/lib/v6/businessMemory` (type), `./ecosystemOrchestrator`, `./deploymentSimulator`, `./globalSelection`, `./strategyTransfer`, `./nodeGenerator`, `./intelligenceNetwork`
- **Runtime path**: `getEcosystemSnapshot()` called on admin load; `runEvolutionTick()` called on admin button press
- **Status**: WIRED

---

## LIB/V8 (7 files — all WIRED)

---

### `lib/v8/agents/economicAgent.ts`

- **Imported by**: `lib/v8/core/recursiveLoop.ts`, `lib/v8/markets/attentionMarket.ts`, `lib/v8/physics/conversionPhysics.ts`, `lib/v8/evolution/strategyField.ts`, `lib/v8/equilibrium/marketEquilibrium.ts`, `lib/v8/intelligence/emergenceDetector.ts`
- **Imports**: `@/lib/v7/ecosystemOrchestrator` (type)
- **Runtime path**: Core agent type; `bootstrapAgents()`, `computeAgentFitness()`, `fitnessTrend()` called throughout v8 tick cycle
- **Status**: WIRED

---

### `lib/v8/markets/attentionMarket.ts`

- **Imported by**: `lib/v8/core/recursiveLoop.ts`, `lib/v8/equilibrium/marketEquilibrium.ts` (type), `lib/v8/intelligence/emergenceDetector.ts` (type)
- **Imports**: `../agents/economicAgent`
- **Runtime path**: `allocateAttention()`, `applyAttentionAllocation()` called in each economic tick
- **Status**: WIRED

---

### `lib/v8/physics/conversionPhysics.ts`

- **Imported by**: `lib/v8/core/recursiveLoop.ts`, `lib/v8/intelligence/emergenceDetector.ts` (type)
- **Imports**: `../agents/economicAgent`
- **Runtime path**: `computeEconomyConversions()`, `applyConversions()` called in each economic tick
- **Status**: WIRED

---

### `lib/v8/evolution/strategyField.ts`

- **Imported by**: `lib/v8/core/recursiveLoop.ts`, `lib/v8/equilibrium/marketEquilibrium.ts` (type)
- **Imports**: `../agents/economicAgent`
- **Runtime path**: `evolveStrategies()` called in each economic tick. Note: also called in `getEconomicSnapshot()` without persisting — a side-effect in a read-only function.
- **Status**: WIRED

---

### `lib/v8/equilibrium/marketEquilibrium.ts`

- **Imported by**: `lib/v8/core/recursiveLoop.ts`, `lib/v8/intelligence/emergenceDetector.ts` (type)
- **Imports**: `../agents/economicAgent`, `../markets/attentionMarket` (type), `../evolution/strategyField` (type)
- **Runtime path**: `analyseEquilibrium()` called in each economic tick
- **Status**: WIRED

---

### `lib/v8/intelligence/emergenceDetector.ts`

- **Imported by**: `lib/v8/core/recursiveLoop.ts`
- **Imports**: `../agents/economicAgent`, `../markets/attentionMarket` (type), `../physics/conversionPhysics` (type), `../equilibrium/marketEquilibrium` (type)
- **Runtime path**: `detectEmergence()` called in each economic tick. `equilibrium` parameter is passed but immediately voided (`void equilibrium`) — placeholder for future detection patterns.
- **Status**: WIRED

---

### `lib/v8/core/recursiveLoop.ts`

- **Imported by**: `app/admin/page.tsx` (getEconomicSnapshot, runEconomicTick)
- **Imports**: all v8 submodules, `@/lib/v7/ecosystemOrchestrator`
- **Runtime path**: `getEconomicSnapshot()` on admin load; `runEconomicTick()` on admin button press. Both are admin-only — no user-facing page executes v8.
- **Status**: WIRED

---

## Architecture Existing But Not Currently Executed

The following systems are implemented in full but have zero runtime execution path reachable by users or automated processes:

---

### v6 Autonomous Operator (`runAutonomousLoop`)

**Files**: `lib/v6/autonomousLoop.ts`, `lib/v6/marketingEngine.ts`, `lib/v6/businessRules.ts`

The entire autonomous business operator pipeline (`detect → strategy → rules → marketing → simulate → memory → log`) is implemented but `runAutonomousLoop()` is never called. The admin panel reads the decision log (`loadDecisionLog()`) but never triggers the loop. The operator exists as read-only display infrastructure. It has never run.

---

### v5 A/B Test Orchestrator (`assignVariant`)

**Files**: `lib/v5/testOrchestrator.ts`, `lib/v5/feedbackLoop.ts`, `lib/v5/revenueSimulator.ts`, `lib/v5/weightOptimizer.ts`

The multi-variant A/B/C/D test system — deterministic variant assignment via djb2 hash, per-session persistence in localStorage, revenue simulation across variants, weight optimisation toward the best performer, and a session-end feedback loop — is fully implemented. None of it is connected to any page. Results page uses the base scoring path only. Variant assignment never happens.

---

### v5 Revenue Simulation

**File**: `lib/v5/revenueSimulator.ts`

Rank-decay click rate model and per-variant revenue simulation fully implemented. Never called.

---

### v1 Recommendation Engine (`getRecommendation`)

**Files**: `lib/engine.ts`, `lib/tracker.ts`, `lib/events.ts`

The original v1 rule-based engine (`logic.json` rules), its localStorage event tracker, and the event sync module are all present. The app uses v3+ scoring pipeline via `lib/recommendByCategory.ts`. These three files have been dead since v2.

---

### GEO Engine Facade (`geoEngine.ts`)

**File**: `lib/geo/geoEngine.ts`

A unified facade over `geoContentEngine`, `entityExtractor`, `geoScore`, and `geoSignals` is fully implemented in `lib/geo/geoEngine.ts`. Every page that needs GEO functionality imports the individual modules directly instead. The facade has never been wired to a page.

---

### AEL Activation Gate (`aelGate.ts`)

**File**: `lib/ael/aelGate.ts`

The gate that evaluates whether sufficient real-user signal exists to safely activate autonomous expansion (100 sessions / 20 affiliate clicks / 1 conversion) is implemented but never evaluated. The AEL build pipeline runs unconditionally without checking this gate.

---

### AEL Content Templates

**File**: `lib/ael/contentTemplates.ts`

v4 content templates for AEL-generated pages are implemented. Not imported by the enrichment pipeline or any page renderer.

---

### Subdirectory Module Duplicates (dead)

These subdirectory files shadow root-level equivalents and are never imported:

| Subdirectory file | Root equivalent in use |
|---|---|
| `lib/events/eventLogger.ts` | `lib/eventLogger.ts` |
| `lib/events/eventTypes.ts` | `@/types/event` |
| `lib/scoring/basicScoring.ts` | `lib/scoring.ts` |
| `lib/scoring/compositeScoring.ts` | `lib/compositeRanking.ts` |
| `lib/revenue/revenueEngine.ts` | `lib/revenueEngine.ts` |
| `lib/truth/truthEngine.ts` | `lib/truthModel.ts` |

---

### Layout Components (Header, Footer, ProductCard family)

**Files**: `components/Layout/Header.tsx`, `components/Layout/Footer.tsx`, `components/Product/ProductCard.tsx`, `components/Product/ProductScoreBar.tsx`, `components/Product/RevenueBadge.tsx`, `components/Analytics/RevenueTable.tsx`, `components/geo/GeoBlock.tsx`

Seven components that exist but are never mounted. All pages inline their own header/footer markup. Results page renders product data directly without `ProductCard`. Revenue table and GeoBlock have no importers.

---

### SEO Intent Map

**File**: `lib/seo/intentMap.ts`

A mapping from user intent signals to recommended pages is implemented. Never consulted by the routing, recommendation, or redirect layers.

---

### Event Aggregator (runtime functions)

**File**: `lib/learning/eventAggregator.ts`

The `FunnelMetrics` and `AggregatedIntelligence` types are used in the admin traffic panel and `FunnelChart`. The aggregation functions (`aggregateEvents()`, etc.) are never called — the component receives data as props from the parent, which also never calls the aggregator.

---

## File Index

| File | Status |
|------|--------|
| `app/layout.tsx` | WIRED |
| `app/page.tsx` | WIRED |
| `app/quiz/page.tsx` | WIRED |
| `app/results/page.tsx` | WIRED |
| `app/admin/page.tsx` | WIRED |
| `app/admin/ael/page.tsx` | WIRED |
| `app/admin/growth/page.tsx` | WIRED |
| `app/admin/growth/geo/page.tsx` | WIRED |
| `app/admin/growth/traffic/page.tsx` | WIRED |
| `app/sitemap.ts` | WIRED |
| `app/robots.ts` | WIRED |
| `app/api/events/route.ts` | WIRED |
| `app/api/events/batch/route.ts` | WIRED |
| `app/api/outcomes/route.ts` | WIRED |
| `app/api/truthModel/route.ts` | WIRED |
| `app/api/revenue/route.ts` | WIRED |
| `app/api/geo/signals/route.ts` | WIRED |
| `app/api/ael/categories/route.ts` | WIRED |
| `app/api/ael/pages/route.ts` | WIRED |
| `app/api/ael/state/route.ts` | WIRED |
| `app/(landing)/[slug]/page.tsx` | WIRED |
| `app/(landing)/best-laptops-for-gaming/page.tsx` | WIRED |
| `app/(landing)/best-laptops-for-students/page.tsx` | WIRED |
| `app/(landing)/best-budget-laptops/page.tsx` | WIRED |
| `app/(landing)/laptops-for-coding/page.tsx` | WIRED |
| `app/(landing)/work-from-home-laptops/page.tsx` | WIRED |
| `app/(landing)/generated/[slug]/page.tsx` | WIRED |
| `components/geo/GeoSignalTracker.tsx` | WIRED |
| `components/landing/TrafficLandingTemplate.tsx` | WIRED |
| `components/Analytics/FunnelChart.tsx` | WIRED |
| `components/Analytics/RevenueTable.tsx` | UNUSED |
| `components/Product/ProductCard.tsx` | UNUSED |
| `components/Product/ProductScoreBar.tsx` | UNUSED |
| `components/Product/RevenueBadge.tsx` | UNUSED |
| `components/Layout/Header.tsx` | UNUSED |
| `components/Layout/Footer.tsx` | UNUSED |
| `components/geo/GeoBlock.tsx` | UNUSED |
| `lib/engine.ts` | UNUSED |
| `lib/tracker.ts` | UNUSED |
| `lib/events.ts` | UNUSED |
| `lib/eventLogger.ts` | WIRED |
| `lib/eventStore.ts` | WIRED |
| `lib/globalIntelligence.ts` | WIRED |
| `lib/segment.ts` | WIRED |
| `lib/learningEngine.ts` | WIRED |
| `lib/truthModel.ts` | WIRED |
| `lib/scoring.ts` | WIRED |
| `lib/recommendByCategory.ts` | WIRED |
| `lib/recommend.ts` | UNUSED |
| `lib/compositeRanking.ts` | WIRED |
| `lib/feedback.ts` | WIRED |
| `lib/learning.ts` | WIRED |
| `lib/category.ts` | WIRED |
| `lib/revenueEngine.ts` | WIRED |
| `lib/segmentRevenue.ts` | WIRED |
| `lib/trafficWeights.ts` | WIRED |
| `lib/timeDecay.ts` | WIRED |
| `lib/outcomeEngine.ts` | WIRED |
| `lib/biasCorrection.ts` | WIRED |
| `lib/confidence.ts` | WIRED |
| `lib/globalMultiplier.ts` | WIRED |
| `lib/revenueLearningLoop.ts` | WIRED |
| `lib/metrics/revenueMetrics.ts` | WIRED |
| `lib/events/eventLogger.ts` | UNUSED |
| `lib/events/eventTypes.ts` | UNUSED |
| `lib/scoring/basicScoring.ts` | UNUSED |
| `lib/scoring/compositeScoring.ts` | UNUSED |
| `lib/revenue/revenueEngine.ts` | UNUSED |
| `lib/revenue/trafficValue.ts` | UNUSED |
| `lib/truth/truthEngine.ts` | UNUSED |
| `lib/session/sessionMemory.ts` | WIRED |
| `lib/analytics/liteAnalytics.ts` | WIRED |
| `lib/utils/helpers.ts` | UNUSED |
| `lib/traffic/trafficSource.ts` | UNUSED |
| `lib/learning/eventAggregator.ts` | PARTIALLY_WIRED |
| `lib/learning/learningEngine.ts` | WIRED |
| `lib/seo/intentMap.ts` | UNUSED |
| `lib/seo/metaBuilder.ts` | WIRED |
| `lib/seo/internalLinks.ts` | WIRED |
| `lib/geo/geoContentEngine.ts` | WIRED |
| `lib/geo/entityExtractor.ts` | WIRED |
| `lib/geo/geoScore.ts` | WIRED |
| `lib/geo/schemaGenerator.ts` | WIRED |
| `lib/geo/geoSignals.ts` | PARTIALLY_WIRED |
| `lib/geo/geoEngine.ts` | UNUSED |
| `lib/ael/enrichmentPipeline.ts` | WIRED |
| `lib/ael/pageGenerator.ts` | WIRED |
| `lib/ael/expansionEngine.ts` | PARTIALLY_WIRED |
| `lib/ael/categoryGenerator.ts` | PARTIALLY_WIRED |
| `lib/ael/intentDiscovery.ts` | PARTIALLY_WIRED |
| `lib/ael/feedbackLoop.ts` | PARTIALLY_WIRED |
| `lib/ael/revenueScanner.ts` | PARTIALLY_WIRED |
| `lib/ael/aelGate.ts` | UNUSED |
| `lib/ael/intentMiningEngine.ts` | PARTIALLY_WIRED |
| `lib/ael/categoryDiscoveryEngine.ts` | PARTIALLY_WIRED |
| `lib/ael/contentTemplates.ts` | UNUSED |
| `lib/ael/internalLinkExpansion.ts` | PARTIALLY_WIRED |
| `lib/ael/expansionTrigger.ts` | PARTIALLY_WIRED |
| `lib/v5/variantEngine.ts` | WIRED |
| `lib/v5/revenueSimulator.ts` | UNUSED |
| `lib/v5/weightOptimizer.ts` | PARTIALLY_WIRED |
| `lib/v5/performanceTracker.ts` | WIRED |
| `lib/v5/feedbackLoop.ts` | UNUSED |
| `lib/v5/testOrchestrator.ts` | UNUSED |
| `lib/v6/opportunityDetector.ts` | WIRED |
| `lib/v6/strategyEngine.ts` | WIRED |
| `lib/v6/marketingEngine.ts` | PARTIALLY_WIRED |
| `lib/v6/businessMemory.ts` | WIRED |
| `lib/v6/revenueControl.ts` | WIRED |
| `lib/v6/businessRules.ts` | PARTIALLY_WIRED |
| `lib/v6/autonomousLoop.ts` | PARTIALLY_WIRED |
| `lib/v7/ecosystemOrchestrator.ts` | WIRED |
| `lib/v7/nodeGenerator.ts` | WIRED |
| `lib/v7/strategyTransfer.ts` | WIRED |
| `lib/v7/intelligenceNetwork.ts` | WIRED |
| `lib/v7/deploymentSimulator.ts` | WIRED |
| `lib/v7/globalSelection.ts` | WIRED |
| `lib/v7/evolutionEngine.ts` | WIRED |
| `lib/v8/agents/economicAgent.ts` | WIRED |
| `lib/v8/markets/attentionMarket.ts` | WIRED |
| `lib/v8/physics/conversionPhysics.ts` | WIRED |
| `lib/v8/evolution/strategyField.ts` | WIRED |
| `lib/v8/equilibrium/marketEquilibrium.ts` | WIRED |
| `lib/v8/intelligence/emergenceDetector.ts` | WIRED |
| `lib/v8/core/recursiveLoop.ts` | WIRED |
