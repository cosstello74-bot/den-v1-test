You are resuming work on **DEN** — a decision intelligence platform for UK electronics buyers.

## Project location
`C:\Users\USER\den-v1` — Next.js 14, TypeScript, Tailwind, Supabase

## Read these files immediately to get full context
- `PRODUCT.md` — brand voice, users, design principles
- `DESIGN.md` — full design system (colours, typography, components, named rules)
- `DEN_PRODUCTION_READINESS_REPORT.md` — what was wrong before this session

## Current state (as of 2026-06-05)
Live at **https://den-v1.vercel.app**

All 4 launch blockers resolved and deployed:
- **B1** ✅ Real Amazon ASINs in `data/products.json` — `TAG_PLACEHOLDER` still needs replacing with real Associates tag
- **B2** ✅ Admin password auth at `/admin/login` — password set in Vercel env
- **B3** ✅ Supabase event store — `lib/db/supabaseClient.ts`, async `lib/eventStore.ts`, `den_events` table live
- **B4** ✅ Privacy policy at `/privacy`, banner in layout, footer link added

## Infrastructure
- Vercel project: `cosstello74-8330s-projects/den-v1`
- Supabase project ref: `evcxnmenhbyaxlxnqndd`
- Env vars set on Vercel: `ADMIN_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Google Stitch MCP: connected (`https://stitch.googleapis.com/mcp`)

## Still outstanding
1. Replace `TAG_PLACEHOLDER` in `data/products.json` with real Amazon Associates tag
2. Replace `[contact@den.so]` placeholders in `app/privacy/page.tsx`
3. Verify all 12 Amazon ASINs resolve to correct products
4. Non-blocking: OG image, `geoSignals.json` seed data, TypeScript strict mode, tests

## Key commit history
- `49174a3` — B3 + B4 (Supabase event store, privacy policy)
- `970fdaa` — B1 + B2 (affiliate URLs, admin auth)

## How to deploy
```
cd C:\Users\USER\den-v1 && npx vercel deploy --prod
```

Now read PRODUCT.md and DESIGN.md, confirm you're up to speed, and ask what to work on next.
