You are resuming work on **DEN** — a decision intelligence platform for UK electronics buyers.

## Project location
`C:\Users\USER\den-v1` — Next.js 14, TypeScript, Tailwind, Supabase

## Read these files immediately to get full context
- `PRODUCT.md` — brand voice, users, design principles
- `DESIGN.md` — design system (warm cream editorial palette — Outfit font, terracotta accent)

## Current state (as of 2026-06-08)
Live at **https://den-v1.vercel.app** | Domain: **askden.co**

All 4 launch blockers resolved and deployed (B1–B4). Since then:
- Full design overhaul: warm cream editorial palette (`paper: #F4EFE6`, `accent: #B97A6B` terracotta)
- Outfit (Google Font) loaded via `next/font/google`
- Homepage: dark ink hero + bento grid + terracotta stats belt
- Real logo (`/public/logo.png`) across all navs
- OG image at `app/opengraph-image.tsx`
- `metadataBase` set to `https://askden.co`
- Privacy policy live at `/privacy` — contact `hello@askden.co`

## Affiliate setup (Awin — pending approval)
- Network: **Awin** (applications submitted for Currys, Laptops Direct, John Lewis)
- Amazon Associates: **not used** — Amazon URLs in `data/products.json` are direct product links (no tag)
- Awin URLs in `affiliate_urls` are all `"PENDING"` — resolver falls back to direct Amazon links until live
- When Awin approves: add `AWIN_PUBLISHER_ID=<id>` to Vercel env vars
- Resolver: `lib/v4/affiliateResolver.ts` — handles PENDING gracefully, no broken links

## Infrastructure
- Vercel project: `cosstello74-8330s-projects/den-v1`
- Supabase project ref: `evcxnmenhbyaxlxnqndd`
- Env vars set on Vercel: `ADMIN_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- To add when Awin approves: `AWIN_PUBLISHER_ID`

## Outstanding
1. Awin approval — add `AWIN_PUBLISHER_ID` to Vercel once confirmed
2. Update Awin `PENDING` URLs in `data/products.json` per retailer (Currys, Laptops Direct, John Lewis)
3. SEO / landing pages — `app/(landing)/` has 5 static intent pages already wired

## Key file map
- `app/page.tsx` — homepage (dark hero + bento grid)
- `app/electronics/page.tsx` — electronics hub
- `app/quiz/page.tsx` — 6-step quiz (client component)
- `app/results/page.tsx` — ranked results with v16 pipeline
- `data/products.json` — 12 products with scores + affiliate URLs
- `lib/v4/affiliateResolver.ts` — affiliate URL resolution
- `lib/den-categories.ts` — category/sub-category definitions
- `tailwind.config.js` — design tokens
- `app/globals.css` — animations, score bars, palette CSS vars

## How to deploy
```
cd C:\Users\USER\den-v1 && npx vercel deploy --prod
```

Now confirm you're up to speed and ask what to work on next.
