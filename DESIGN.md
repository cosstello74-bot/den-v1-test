---
name: DEN
description: Decision intelligence engine for UK electronics buyers
colors:
  ink: "#14202E"
  ink-soft: "#1F2E40"
  paper: "#F4EFE6"
  paper-soft: "#EAE3D3"
  accent: "#B97A6B"
  accent-dark: "#A06258"
  muted: "#5B6779"
  alert: "#8B4843"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(3.2rem, 12vw, 9.5rem)"
    fontWeight: 700
    lineHeight: 0.87
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "30px–36px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "10px–11px"
    fontWeight: 700
    letterSpacing: "0.22em–0.28em"
    textTransform: "uppercase"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
---

# Design System: DEN

## 1. Overview

**Creative North Star: "Warm Editorial Authority"**

DEN is a decision engine with an editorial voice. The design reflects this: warm cream surfaces, confident terracotta accent, Outfit typeface with tight tracking on headings. The aesthetic sits between a premium editorial publication and a product tool — calm, opinionated, never transactional.

This is a departure from generic AI/SaaS dark-mode aesthetics. The warmth signals humanity, not a data dashboard. The restraint signals authority, not a retailer.

**Key Characteristics:**
- Warm cream base (`#F4EFE6`) with a single terracotta accent (`#B97A6B`) used sparingly
- Dark ink (`#14202E`) hero sections create contrast and weight
- Outfit loaded via `next/font/google` — clean geometric sans with personality
- Tight tracking on headings, relaxed leading on body
- Components flat at rest, responsive on interaction only
- Score bars and match indicators use the terracotta accent

## 2. Colors

### CSS Variables (in `app/globals.css`)
```css
--ink:       #14202E   /* primary text + dark surfaces */
--ink-soft:  #1F2E40   /* secondary dark surfaces */
--paper:     #F4EFE6   /* primary background (warm cream) */
--paper-soft:#EAE3D3   /* card/panel backgrounds */
--accent:    #B97A6B   /* terracotta — the sole interactive accent */
--muted:     #5B6779   /* secondary text, metadata */
--line:      rgba(20,32,46,.16)
--line-soft: rgba(20,32,46,.08)
--alert:     #8B4843
```

### Tailwind tokens (in `tailwind.config.js`)
```js
ink:    { DEFAULT: "#14202E", soft: "#1F2E40" }
paper:  { DEFAULT: "#F4EFE6", soft: "#EAE3D3" }
accent: { DEFAULT: "#B97A6B", dark: "#A06258" }
muted:  "#5B6779"
alert:  "#8B4843"
```

### Named Rules
**The Accent Scarcity Rule.** Terracotta covers ≤10% of any screen. Its rarity is its authority. CTAs, active progress bars, score fills, eyebrow labels. If accent appears in more than 2–3 places per viewport, one is wrong.

**Dark Sections Rule.** Hero sections use `bg-ink text-paper` for contrast and weight. Remaining sections use cream. Never mix warm and cold neutrals — the entire palette is warm-toned.

## 3. Typography

**Font:** Outfit via `next/font/google` — loaded with `display: swap`, `variable: --font-outfit`.

Applied globally: `font-family: var(--font-outfit), system-ui, sans-serif`

### Hierarchy
- **Display** (700, clamp 3.2rem–9.5rem, tracking-tighter, leading-[0.87]): Page hero headlines. One per page. `text-paper` on dark, `text-ink` on cream.
- **Headline** (700, 2xl–4xl, tracking-tighter, leading-tight): Section titles, results page h1.
- **Title** (600–700, lg–xl, tracking-tight): Card headings, product names.
- **Body** (400, sm–base, leading-relaxed): All prose. `text-muted` on cream, `text-paper/50` on dark. Max line length ~50ch.
- **Label** (700, 10px–11px, tracking-[0.22em]–[0.28em], uppercase): Eyebrow text, section identifiers, category tags. Always `text-accent` or `text-muted`.

### Named Rules
**Weight-Only Emphasis Rule.** Emphasis via font-weight (400 → 600 → 700) and color step (muted → ink). No italics, no color highlights in editorial content.

## 4. Elevation

Tonal layering on cream surfaces:
- **Base:** `bg-paper` (`#F4EFE6`)
- **Raised:** `bg-paper-soft` (`#EAE3D3`)
- **Borders:** `border-ink/10` → `border-ink/12` → `border-ink/20` on hover

On dark sections (`bg-ink`):
- **Borders:** `border-paper/8` → `border-paper/10`
- **Text:** `text-paper/30` → `text-paper/50` → `text-paper`

**Flat-By-Default Rule.** No shadows at rest on cards. Hover states may use `hover:-translate-y-[1px]` and border colour shift. Primary CTA carries `shadow-2xl shadow-accent/20` — the only persistent shadow.

## 5. Components

### Buttons
- **Primary:** `bg-accent hover:bg-accent-dark text-white font-bold px-7–8 py-3.5–4 rounded-xl transition-all duration-150 active:scale-[0.97]` + `shadow-2xl shadow-accent/20`
- **Ghost:** No background, `border-ink/12`, `text-muted`, hover: `bg-paper-soft`
- **Inline text:** `text-accent hover:text-accent-dark transition-colors duration-150`

### Cards
- Background: `bg-paper-soft`
- Border: `border-ink/12`, hover: `border-accent/40`
- Radius: `rounded-xl` or `rounded-2xl`
- Hover: `hover:bg-[#ddd6c4] hover:-translate-y-[1px]`
- No shadows at rest.

### Score Bars (Signature Component)
- Track: `bg-ink/12`, height `h-2.5`, `rounded-full`
- Fill: `bg-accent`, animated with `clip-path` reveal (1.2s, 400ms delay)
- CSS classes: `.score-bar`, `.score-bar-600`, `.score-bar-800` in `globals.css`
- `@media (prefers-reduced-motion: reduce)` guard in place

### Navigation
- Cream pages: `backdrop-blur-sm bg-paper/90 border-b border-ink/10`, sticky
- Dark hero: `bg-ink backdrop-blur-md border-b border-paper/8`, sticky
- Logo: `/public/logo.png`, `h-9`–`h-12`, no icon-only mark
- No active-state underlines

### Labels / Eyebrows
Always the same pattern:
```jsx
<p className="text-[10px] font-bold tracking-[0.22em] uppercase text-accent mb-2">
  Section label
</p>
```

### Status Badges
- Live: `bg-emerald-50 text-emerald-700 border border-emerald-200`
- Soon: `bg-ink/5 text-muted border border-ink/10`

## 6. Page Structure

### Homepage (`app/page.tsx`)
1. Sticky nav (dark ink)
2. Dark hero — massive display headline, stat belt (terracotta)
3. Cream categories section — featured electronics card + bento grid
4. Cream method section (how it works)
5. Dark closing manifesto + CTA
6. Dark footer

### Electronics hub (`app/electronics/page.tsx`)
- Cream throughout
- 6-card sub-category grid (laptops, phones, tablets, monitors, PCs, headphones)

### Quiz (`app/quiz/page.tsx`)
- Cream, centered single-column
- Progress bar in accent, step dots
- Option cards: `bg-paper-soft` at rest, `bg-[#ddd6c4]` on hover, `bg-accent/10` when selected

### Results (`app/results/page.tsx`)
- Cream, max-w-2xl
- Best match card: `border-accent/30 bg-accent/5`
- Other cards: `border-ink/12 bg-paper-soft`
- Score bar reveals on load

## 7. Do's and Don'ts

### Do:
- Use tonal layering (paper → paper-soft → ink/12 borders) to convey depth
- Cap accent to ≤10% of any screen surface
- Use `text-ink` for headings, `text-muted` for body on cream; `text-paper` / `text-paper/50` on dark
- Respect `prefers-reduced-motion` — all clip-path animations guarded
- Keep body line length at ~50ch (`max-w-[50ch]` or `max-w-[65ch]`)
- Use Outfit weight contrast (400/600/700) for hierarchy — no italics

### Don't:
- Don't use cold grays or blue-toned neutrals — all neutrals are warm
- Don't use gradient text
- Don't add shadows to cards at rest
- Don't use the accent for decorative purposes — only CTAs, active states, score fills, eyebrows
- Don't add a second accent color
- Don't animate layout properties (height, width, padding) — animate opacity and transform only
