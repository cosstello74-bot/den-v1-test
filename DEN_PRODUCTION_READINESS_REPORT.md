# DEN Production Readiness Report

**Date**: 2026-06-03
**Repository**: den-v1
**Auditor**: Claude Code (automated static analysis)
**Branch**: master

---

## Executive Summary

DEN is a Next.js 14.2.5 App Router application implementing a multi-variant affiliate recommendation engine with progressive intelligence layers (v1–v8). The core concept is sound and the codebase demonstrates significant engineering effort. However, several launch-blocking issues exist that prevent safe or profitable deployment in current state.

---

## Category Audits

---

### 1. Build Readiness

**Score: 62 / 100**

**Risks:**
- `next.config.js` is empty (no headers, no redirects, no image domain configuration). Security headers are absent unless Vercel injects them via project settings — not guaranteed.
- No TypeScript strict mode enforced (`strict: true` not confirmed in `tsconfig.json`).
- Multiple `as any[]` casts in `app/results/page.tsx` (line 180) and API routes. These suppress type errors without resolving them.
- Duplicate module pairs exist: root-level files and subdirectory versions appear to coexist (e.g., multiple scoring/seeding variants). Risk of importing the wrong module silently.
- The v8 economic simulation (`lib/v8/core/recursiveLoop.ts`) calls `evolveStrategies()` inside `getEconomicSnapshot()` without persisting results — strategy state diverges on every read, producing inconsistent data in the admin panel.
- No `lint` step in the build pipeline has been verified. ESLint config presence is unconfirmed.

**Fixes:**
- Add `next.config.js` with security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP).
- Resolve all `as any[]` casts with proper typed interfaces.
- Enable `strict: true` in tsconfig and fix resulting type errors.
- Audit and remove duplicate module files; enforce single canonical imports.
- Fix `getEconomicSnapshot()` to not mutate strategy vectors.

**Effort**: 1–2 days

**Launch blocking: NO** (build likely succeeds; risks are correctness and security, not compilation failure)

---

### 2. Runtime Readiness

**Score: 35 / 100**

**Risks:**
- Both API routes (`/api/events` and `/api/events/batch`) maintain state in process-level in-memory variables (`runtimeModel`, `runtimeTruth`). On Vercel's serverless architecture, every cold start resets these to seed data. Multiple concurrent instances will hold divergent state simultaneously. Collected analytics data is effectively ephemeral.
- `fs.writeFileSync` calls in the event API routes are wrapped in try/catch with silent failure. On Vercel's read-only filesystem, writes silently fail on every request. No fallback exists.
- `events.json` and `geoSignals.json` are empty files. The system seeds from these on startup, meaning the intelligence model always initialises from zero in production.
- localStorage is used as the persistence layer for v5–v8 simulation state. This is per-device and per-browser. No server-side persistence exists for any simulation data.
- The `runEconomicTick()` function in v8 boots from v7 ecosystem nodes on every call. With localStorage unavailable server-side and the API stateless, simulation continuity is only maintained within a single user's browser session.
- No database. No Redis. No external state store. No queue.

**Fixes:**
- Replace in-memory API state with a persistent store (Vercel KV, Upstash Redis, PlanetScale, Supabase, or similar).
- Remove `fs.writeFileSync` calls or gate them behind a server environment check with a real fallback.
- Pre-populate `events.json` and `geoSignals.json` with realistic seed data, or remove the dependency.
- Accept that v5–v8 simulations are client-side only and document this explicitly.

**Effort**: 3–5 days (database integration is non-trivial in a serverless context)

**Launch blocking: YES** — analytics state resets on every cold start. Any data-driven intelligence layer degrades silently to baseline.

---

### 3. Security

**Score: 28 / 100**

**Risks:**
- `/admin` is publicly accessible. It is actively linked from the homepage navigation ("Analytics") and the footer ("Analytics"). There is no authentication, no middleware guard, no IP restriction. Any user who clicks the link has full access to the admin dashboard.
- The admin panel exposes internal simulation state, can trigger economic ticks, can run evolution cycles, and displays full agent/market data. This is an operational interface, not a read-only display.
- No `next.config.js` security headers. No CSP policy. Clickjacking protection (`X-Frame-Options`) is absent unless Vercel project settings are configured separately.
- API routes (`/api/events`, `/api/events/batch`) accept POST requests with no authentication and no rate limiting. They accept arbitrary JSON payloads, which are merged into runtime state.
- No input validation on API routes beyond TypeScript type inference (which does not validate at runtime). Malformed payloads could corrupt runtime model state.
- `robots.ts` disallows `/admin/` correctly, but `robots.txt` is not a security mechanism — it is advisory only.
- No CSRF protection on state-mutating API endpoints.
- Affiliate URLs are stored in `data/products.json` (a static file committed to the repository). When replaced with real affiliate URLs, these will be publicly visible in the repository.

**Fixes:**
- Add middleware (`middleware.ts`) to protect `/admin` with at minimum HTTP Basic Auth or a hardcoded password check. Use `next-auth` for proper auth if multi-user access is needed.
- Remove admin links from public-facing navigation and footer.
- Add runtime input validation (zod or equivalent) on all API routes.
- Add rate limiting to API routes (Vercel's built-in rate limiting or `@upstash/ratelimit`).
- Add security headers in `next.config.js`.

**Effort**: 1 day (Basic Auth middleware is 20 lines; full auth is 2–3 days)

**Launch blocking: YES** — admin panel is publicly linked and fully exposed.

---

### 4. SEO

**Score: 58 / 100**

**Risks:**
- No OG image defined in `app/layout.tsx` or `lib/seo/metaBuilder.ts`. Social shares produce no preview image, significantly reducing click-through rates from social platforms.
- `app/layout.tsx` uses generic title "DEN — Decision Intelligence" and a generic description. These are not differentiated or keyword-targeted for any specific user intent.
- The seeding pages (`app/(seeding)/`) exist for programmatic SEO but are thin by nature. If their content is shallow relative to competitor pages, they will not rank.
- Budget labels use GBP (£) throughout (e.g., `budgetOptions` in the quiz). This hard-codes a UK audience signal. If deployed internationally or targeting US audiences, this is a relevance mismatch.
- Canonical URLs depend on `NEXT_PUBLIC_SITE_URL` environment variable. If this is not set in Vercel project settings, canonicals will be empty or incorrect, causing duplicate content signals.
- `app/sitemap.ts` generates a sitemap but uses `NEXT_PUBLIC_SITE_URL` — same risk as canonicals.
- No hreflang tags for international targeting despite GBP currency usage suggesting a UK-specific site.

**Fixes:**
- Create and add a default OG image (1200×630px) to `public/` and reference it in layout metadata.
- Set `NEXT_PUBLIC_SITE_URL` in Vercel environment variables before deployment.
- Improve root layout metadata with targeted title and description.
- Decide on target market (UK vs. international) and align currency, language signals, and hreflang accordingly.

**Effort**: 0.5 days

**Launch blocking: NO** (site will be crawlable and indexable; OG image and metadata are conversion/ranking issues, not blockers)

---

### 5. GEO (Generative Engine Optimisation)

**Score: 44 / 100**

**Risks:**
- The `geoSignals.json` file is empty. The GEO intelligence layer has no training data and will produce no meaningful output at launch.
- Answer Engine Layer (AEL) pages (`app/(ael)/`) exist in the sitemap but their content quality and factual density has not been audited here. Thin AEL pages can actively harm LLM citation probability.
- FAQ schema is implemented on the gaming landing page (`app/(landing)/best-laptops-for-gaming/page.tsx`) — this is correct practice. Consistency across other landing and AEL pages is unconfirmed.
- No `llms.txt` file exists. This is an emerging standard for AI crawler instruction, analogous to `robots.txt`.
- The recommendation engine is opaque to external crawlers — the quiz flow requires JavaScript interaction, meaning the actual product recommendations are not indexable.
- Structured data (`@type: FAQPage`) is present on gaming landing page. Coverage on other pages is unconfirmed.

**Fixes:**
- Seed `geoSignals.json` with manually curated intent/query/page mappings before launch.
- Audit all AEL pages for factual density and citation-worthy content.
- Ensure FAQ schema is present on all landing pages.
- Add `public/llms.txt` with site description and crawl guidance.
- Consider adding static result snapshots or server-rendered recommendation previews for top query intents.

**Effort**: 1–2 days

**Launch blocking: NO** (GEO is an optimisation layer, not a functional requirement)

---

### 6. Affiliate Monetisation

**Score: 0 / 100**

**Risks:**
- ALL 12 affiliate URLs in `data/products.json` are placeholder values: `https://amazon.co.uk/dp/example1` through `https://amazon.co.uk/dp/example12`. These URLs do not resolve to real products. Every affiliate CTA click generates zero revenue and a 404 on Amazon.
- No Amazon Associates tracking IDs are present in any URL. Even if real ASINs were substituted, there would be no commission attribution without `?tag=YOUR-TAG` parameters.
- There is no affiliate disclosure on the site. Under FTC regulations (US), ASA regulations (UK), and most affiliate program terms of service, clear disclosure is required on any page containing affiliate links. Absence of disclosure is a terms-of-service violation and a legal risk.
- The revenue simulation (v5–v8) produces numbers based on placeholder products. All projected revenue figures in the admin panel are fictional.
- No fallback or error handling when an affiliate URL is malformed or a product is removed.

**Fixes:**
- Replace all 12 placeholder URLs with real Amazon ASINs and append a valid Associates tracking tag.
- Add an affiliate disclosure statement to the site footer and/or a dedicated disclosure page.
- Add a validity check step to confirm all affiliate URLs resolve before deployment.
- Consider a product data management approach (CMS, JSON with versioning) to make URL updates maintainable.

**Effort**: 0.5 days for URL replacement; 1 day for disclosure page and ongoing product management setup

**Launch blocking: YES** — site cannot generate any revenue in current state. All affiliate links are broken.

---

### 7. Analytics

**Score: 30 / 100**

**Risks:**
- The analytics system (`/api/events`, `/api/events/batch`) uses in-memory state that resets on every cold start (see Runtime Readiness). Analytics data does not survive past the serverless function instance lifetime.
- `events.json` is empty — no historical data, no seeded baseline.
- No third-party analytics integration (Google Analytics 4, Plausible, Fathom, or equivalent). If the in-memory system fails or resets, there is no fallback data collection.
- The variant assignment system (v5 A/B/C/D) stores variant state in localStorage only. Cross-session analysis is impossible without a user identifier.
- No conversion funnel tracking has been verified at the infrastructure level. Quiz completions, affiliate clicks, and result page views are tracked conceptually in the code but the data does not persist.
- No dashboard or visualisation outside the admin panel. The admin panel itself reads from in-memory state.

**Fixes:**
- Integrate a persistent analytics backend (Vercel Analytics, GA4, or Plausible at minimum for page-level data).
- Persist event data to a database or external analytics service rather than in-memory state.
- Add a unique session/user identifier that persists across requests for funnel analysis.
- Seed `events.json` with representative historical data or remove the dependency.

**Effort**: 1–2 days (drop-in Vercel Analytics is 10 minutes; full custom analytics persistence is 2 days)

**Launch blocking: NO** (site functions without analytics; it is a data loss risk, not a functional blocker)

---

### 8. Data Collection

**Score: 42 / 100**

**Risks:**
- No privacy policy page exists. Collecting behavioral data (quiz responses, click events, intent signals) without a privacy policy violates GDPR (UK/EU), CCPA (California), and similar regulations. This is a legal requirement, not a recommendation.
- No cookie consent mechanism. The site uses localStorage for persistent state. While localStorage is not technically a cookie, storing user-identifying data (session IDs, variant assignments) without consent notice may still fall under GDPR Article 6 in the UK/EU context.
- Behavioral data (quiz answers, product preferences, device signals) is collected and used to influence recommendations. This constitutes profiling under GDPR and requires a lawful basis.
- The batch event API (`/api/events/batch`) accepts and stores behavioral payloads with no size limit, rate limiting, or content validation. This is a data integrity and potential abuse vector.
- `geoSignals.json` is empty — geo-behavioural targeting has no data to act on.
- No data retention policy. No deletion mechanism. No subject access request handling.

**Fixes:**
- Create a `Privacy Policy` page before launch. At minimum address: what data is collected, how it is used, retention period, and user rights.
- Add a cookie/data notice banner (a simple dismissable notice suffices for localStorage-only sites in many jurisdictions, but consult legal advice for UK/EU deployment).
- Add payload size limits and rate limiting to the event batch API.
- Determine GDPR lawful basis for behavioral profiling (legitimate interest or explicit consent).

**Effort**: 1 day (privacy policy page) + legal review (external)

**Launch blocking: YES** — collecting behavioral data without a privacy policy is a legal violation in UK/EU jurisdictions.

---

### 9. Admin System

**Score: 20 / 100**

**Risks:**
- No authentication of any kind. The admin panel is publicly accessible via a direct link from the homepage.
- The admin panel is not just a read-only dashboard — it can trigger `runEconomicTick()` and `runEvolutionTick()`, mutating simulation state stored in localStorage (client-side) and in-memory server state.
- Admin panel reads from and displays internal simulation state (agent fitness, strategy vectors, equilibrium reports, emergence events). This exposes the full operational model to any visitor.
- The admin tab structure (`overview | intelligence | behavior | truth | health | v6 | v7 | v8`) reveals the full system architecture to any observer.
- The "truth" tab presumably exposes the raw inference model and scoring weights.
- No audit logging of admin actions. No record of when economic ticks were triggered or by whom.
- Footer of admin page previously read "DEN v6", then "DEN v7", then "DEN v8" — version string has been updated but confirms the incremental build approach. No versioned API or compatibility layer exists.
- Admin panel file (`app/admin/page.tsx`) is reportedly large — all tabs in a single client component is an architecture concern for maintainability and performance.

**Fixes:**
- Immediately remove admin links from homepage nav and footer.
- Add `middleware.ts` to redirect unauthenticated requests to `/admin` to a login page or return 401.
- At minimum: environment-variable-based password check (`ADMIN_PASSWORD`).
- Move admin panel to `/app/admin/` with a separate `layout.tsx` that enforces auth.
- Add audit logging for state-mutation actions.

**Effort**: 0.5–1 day for basic auth; 2–3 days for proper auth system

**Launch blocking: YES** — public admin access exposes internal system state and operational controls to any visitor.

---

### 10. Technical Debt

**Score: 45 / 100**

**Risks:**
- **Eight progressive layers (v1–v8)** of intelligence exist. v1–v4 are presumably legacy. It is unclear which layers are active in the production user flow vs. which are admin-only simulations. The interaction between layers is implicit.
- **Duplicate modules**: Multiple root-level and subdirectory versions of core files exist (scoring, seeding, etc.). This creates ambiguity about which version is canonical.
- **No tests**: No test files have been observed anywhere in the codebase. Zero unit tests, zero integration tests, zero end-to-end tests. The multi-variant ranking system, revenue simulation, and economic physics have no coverage.
- **`as any[]` suppression**: Type safety is bypassed at critical data boundaries (quiz results, API responses). Type errors at these boundaries could cause silent runtime failures.
- **Non-idempotent snapshot**: `getEconomicSnapshot()` mutates strategy vectors on each call (runs `evolveStrategies()` internally). A read operation should not produce side effects.
- **`void equilibrium`** comment in `emergenceDetector.ts` line 222: a typed parameter is declared, passed, and immediately voided. This is a placeholder indicating incomplete implementation.
- **Budget in GBP hard-coded**: `£200`, `£500`, `£1000`, etc. throughout quiz and product data. Internationalisation has not been considered.
- **`data/products.json` contains only 12 products** across all categories. This is insufficient product depth for a real recommendation engine.
- **localStorage as primary simulation persistence**: Acceptable for client-side simulation but means all v5–v8 state is per-device, not portable, and invisible to server-side logic.
- **No error boundaries**: Client-side simulation errors will propagate and crash the admin panel without graceful degradation.

**Fixes:**
- Document which v-layers are production-active vs. simulation/admin-only.
- Add a test suite for at minimum the scoring and variant assignment logic.
- Resolve all `as any[]` casts.
- Fix `getEconomicSnapshot()` to be truly read-only.
- Audit and consolidate duplicate module pairs.
- Add React Error Boundaries to the admin panel.

**Effort**: 3–5 days for test coverage; 1 day for structural cleanup

**Launch blocking: NO** (technical debt affects maintainability and correctness, not initial deployability)

---

## Scoring Summary

| # | Category | Score | Launch Blocking |
|---|----------|-------|-----------------|
| 1 | Build Readiness | 62 | NO |
| 2 | Runtime Readiness | 35 | YES |
| 3 | Security | 28 | YES |
| 4 | SEO | 58 | NO |
| 5 | GEO | 44 | NO |
| 6 | Affiliate Monetisation | 0 | YES |
| 7 | Analytics | 30 | NO |
| 8 | Data Collection | 42 | YES |
| 9 | Admin System | 20 | YES |
| 10 | Technical Debt | 45 | NO |

**LAUNCH SCORE: 36 / 100**

---

## Launch Blockers (5 of 10 categories)

| Blocker | Category | Minimum Fix |
|---------|----------|-------------|
| B1 | Affiliate Monetisation | Replace all 12 placeholder URLs with real ASINs + Associates tracking tag |
| B2 | Security | Add auth middleware to `/admin`; remove public admin links from nav/footer |
| B3 | Runtime Readiness | Replace in-memory API state with persistent storage |
| B4 | Data Collection | Add privacy policy page before collecting any behavioral data |
| B5 | Admin System | (covered by B2 — auth + link removal) |

---

## GO / NO-GO DECISION

### NO-GO

The system cannot generate revenue (B1), exposes internal operational controls publicly (B2/B5), loses all analytics data on every serverless cold start (B3), and collects behavioral data without a privacy policy (B4).

None of these are architectural limitations requiring extended redesign. All five blockers can be resolved in approximately 5–8 working days of focused effort:

- Day 1: Replace affiliate URLs, add Associates tracking, add affiliate disclosure
- Day 1–2: Admin auth middleware, remove public admin links, privacy policy page
- Day 3–5: Persistent storage integration for API state (Vercel KV / Upstash Redis)

The non-blocking issues (no OG image, empty `geoSignals.json`, GBP hard-coding, no tests, `as any[]` casts) represent post-launch improvement work and do not prevent a soft launch.

**Minimum viable launch requires resolving B1–B4. Until then, deployment serves visitors with broken affiliate links, exposes the admin system publicly, and collects data without legal basis.**
