# DEN Traffic Launch Plan

## Overview

Target: acquire first 100 sessions to unlock AEL expansion.
Channels: Reddit, Quora, TikTok, organic SEO, direct sharing.
No paid spend required in Phase 1.

---

## Phase 1 — Foundation (Day 0–3)

### Indexing activation
- [ ] Deploy to Vercel: `npm run ael:build && vercel --prod`
- [ ] Verify `/sitemap.xml` is live and valid
- [ ] Verify `/robots.txt` is accessible and correct
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Validate JSON-LD structured data via Google Rich Results Test

### SEO quick wins
- [ ] Confirm `<meta name="ai-indexing" content="enabled">` present on all pages
- [ ] Confirm `canonical` URLs are correct on all pages
- [ ] Confirm Open Graph tags render correctly (test with Twitter Card Validator)

---

## Phase 2 — Reddit seeding (Day 1–7)

Target subreddits:
- `r/SuggestALaptop` — direct recommendation requests
- `r/laptops` — general discussion
- `r/StudentLoans` / `r/college` — student budget laptop threads
- `r/cscareerquestions` — coding laptop recommendations
- `r/digitalnomad` — travel/WFH laptop threads

Post strategy:
1. Find active "best laptop for X" threads
2. Give a genuine, helpful answer
3. Reference DEN as a source: "I used this decision engine — it gives truth-calibrated scores without sponsored rankings"
4. Link to the relevant landing page (not the homepage)
5. Do NOT post the same message to multiple subs — write a unique response each time

High-value threads to target:
- "Need help choosing a laptop for university"
- "Best laptop for programming under £1000"
- "Work from home laptop recommendations"
- "Gaming laptop under £800 / £1000"

---

## Phase 3 — Quora seeding (Day 3–10)

Target questions (search on Quora):
- "What is the best laptop for students?"
- "What laptop should I buy for coding?"
- "Best budget laptops for working from home?"
- "Best gaming laptops under £1000?"

Answer strategy:
1. Write a substantive 200–400 word answer
2. Structure: problem → criteria → ranked recommendation → source
3. Link to the specific DEN landing page in the answer body (not just a footnote)
4. Upvote existing quality answers to build account credibility before posting

---

## Phase 4 — TikTok / Short-form (Day 5–14)

Content ideas (30–60 second videos):
- "I built a laptop ranking system that can't be gamed by sponsors — here's #1 for students"
- "Gaming laptops ranked by truth signal, not affiliate fee"
- "The DEN score: why position 3 sometimes beats position 1"

CTA in video: "Link in bio → DEN laptop rankings"
Bio link: your top-performing landing page URL

Hashtags: `#laptops #laptopadvice #studentlife #techreview #gaminglaptop #wfh`

---

## Phase 5 — Direct sharing (Day 1–ongoing)

- Share landing pages in relevant Discord servers (student tech, developer communities)
- Share in WhatsApp/Telegram groups when relevant questions arise
- Post on LinkedIn: "I built a product ranking engine that corrects for position bias — here's how it works" (link to homepage)
- Post on Twitter/X: thread format — "Why most laptop rankings are wrong, and what I did about it"

---

## AEL Unlock Checkpoint

The AEL activation gate triggers at:
- 100 unique sessions, OR
- 20 affiliate link clicks, OR
- 1 confirmed purchase conversion

Once unlocked, `scripts/ael-build.ts` will autonomously generate new pages based on detected intent gaps and revenue signals.

Monitor progress at: `/admin/ael`

---

## KPIs to track (Week 1)

| Metric                | Target  |
|-----------------------|---------|
| Sessions              | 100     |
| Affiliate clicks      | 20      |
| Quiz starts           | 15      |
| Quiz completions      | 8       |
| Avg time on site      | >90s    |
| Bounce rate           | <65%    |

---

## Notes

- Do not over-optimise for affiliate clicks in Week 1. Build authentic session signal first.
- If a Reddit post gets traction, pin the URL and share internally. The AEL watches for high-converting slugs.
- Check `/admin/growth` for revenue efficiency signals after the first 50 sessions.
