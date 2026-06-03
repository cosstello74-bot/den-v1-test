# DEN Revenue Validation Checklist

## Purpose

Verify that the full monetisation loop is operating correctly end-to-end:
affiliate click → revenue model → composite ranking influence → learning loop update.

---

## Layer 1 — Affiliate link integrity

- [ ] All `affiliate_url` values in `data/products.json` are valid, accessible, and redirect to the correct product pages
- [ ] Links include correct affiliate tracking parameters
- [ ] `rel="noopener noreferrer nofollow"` is present on all affiliate `<a>` tags
- [ ] `target="_blank"` is set on all affiliate links
- [ ] Affiliate programme accounts are active and approved (Amazon Associates, etc.)

---

## Layer 2 — Event tracking

- [ ] `affiliate_clicked` event fires on every "View deal" button click
- [ ] `product_viewed` event fires when a product card scrolls into view
- [ ] `product_clicked` event fires on product name/card interaction
- [ ] Events include `productId`, `sessionId`, `timestamp`, and `metadata.segment`
- [ ] Events persist to `data/events.json` (check via `/api/events` GET)
- [ ] Batch endpoint `/api/events/batch` accepts arrays of events without error

---

## Layer 3 — Revenue model

- [ ] `data/revenueModel.json` exists and has entries for all product IDs
- [ ] `/api/revenue` GET returns a valid `RevenueModelSnapshot`
- [ ] Affiliate payout values are set to realistic estimates (default: £8–£25 per conversion)
- [ ] Conversion rate estimates are initialised (default: 0.03–0.08)
- [ ] Revenue trend is set appropriately per product (`rising` / `stable` / `declining`)

---

## Layer 4 — Composite ranking

- [ ] Results page applies `applyCompositeRanking` from `lib/compositeRanking.ts`
- [ ] Revenue score appears in product cards (badge visible for high-efficiency products)
- [ ] Composite formula confirmed: `0.6 × intelligence_score + 0.4 × revenue_score`
- [ ] Revenue score does not exceed 20/100 contribution to final position (normalised ÷ 5)

---

## Layer 5 — Learning loop

- [ ] After 10+ affiliate click events, POST to `/api/revenue` triggers model update
- [ ] `revenueLearningLoop.updateRevenueModel` runs without error
- [ ] Updated model persists (or logs a graceful write error on Vercel read-only FS)
- [ ] `lib/ael/aelGate.ts` `evaluateAelGate` returns correct unlock status based on current event data

---

## Layer 6 — Admin dashboards

- [ ] `/admin/growth` renders without error and shows revenue overview
- [ ] `/admin/growth/geo` renders GEO score table and engagement signals
- [ ] `/admin/ael` renders expansion opportunities and AEL gate status
- [ ] All three admin dashboards show correct data (not empty states)

---

## Layer 7 — AEL revenue scan

- [ ] `data/ael/expansion-state.json` has at least one revenue scan result
- [ ] Revenue scan correctly identifies high-value, low-visibility products
- [ ] `revenueScanner.ts` `urgencyScore` correctly ranks opportunities
- [ ] `scripts/ael-build.ts` completes without error: `npm run ael:build`

---

## Smoke test sequence

1. Open `/laptops` → verify JSON-LD structured data in page source
2. Open `/quiz?category=laptops` → complete quiz → reach `/results`
3. Click "View deal" on a product → verify `affiliate_clicked` event in `/api/events`
4. POST to `/api/revenue` → verify model snapshot updates
5. Check `/admin/growth` → verify session and click data appears
6. Check `/admin/ael` → verify AEL gate progress updates

---

## Revenue formula reference

```
revenue_score =
  affiliate_value
  × conversion_probability
  × intent_strength
  × segment_multiplier
  × traffic_source_weight
  / 20                      ← normalises to 0–100
```

Final display score:
```
display_score = 0.6 × intelligence_score + 0.4 × revenue_score
```

---

## Known limitations

- Affiliate conversion data is proxied (affiliate_clicked ÷ product_viewed) until real purchase webhooks are integrated
- Revenue model persists in memory on Vercel; model resets on cold start (by design until a database is added)
- AEL gate requires 100 sessions / 20 clicks / 1 conversion — will not trigger from a cold start without seeding
