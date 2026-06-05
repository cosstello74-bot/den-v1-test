---
name: DEN
description: Decision intelligence engine for UK electronics buyers
colors:
  workbench-deep: "#030712"
  instrument-surface: "#111827"
  boundary-line: "#1f2937"
  mid-tone: "#374151"
  annotation: "#6b7280"
  reading-text: "#d1d5db"
  output-text: "#ffffff"
  signal: "#4f46e5"
  signal-active: "#6366f1"
  signal-border: "#3730a3"
  analysis-violet: "#8b5cf6"
  analysis-depth: "#2e1065"
  analysis-border: "#5b21b6"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section: "56px"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.output-text}"
    rounded: "{rounded.md}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.signal-active}"
    textColor: "{colors.output-text}"
    rounded: "{rounded.md}"
    padding: "14px 32px"
  card:
    backgroundColor: "{colors.instrument-surface}"
    textColor: "{colors.reading-text}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  badge:
    backgroundColor: "{colors.analysis-depth}"
    textColor: "{colors.analysis-violet}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: DEN

## 1. Overview

**Creative North Star: "The Specialist's Workbench"**

DEN is not a UI, a blog, or a comparison tool. It is a decision system that produces outcomes. The design reflects this: tools are visible but not decorative, every element exists for a purpose, output quality matters more than visual flourish. The workbench metaphor is exact — a place built by experts, for decisions, where the instrument you reach for is always exactly where it should be.

The system is dark by design. Users arrive mid-research, often at night, cross-referencing multiple tabs. The dark surface reduces ambient fatigue and signals "I'm already working" — not "let me sell you something." Depth is conveyed through tonal layering (three levels: base, surface, raised) not shadows. The single accent, Signal indigo, appears sparingly. When it appears, it means something.

This is the antithesis of the autopilot SEO content farm: no thin editorial filler, no affiliate-first structure, no AI slop aesthetic. It is also not a price comparison aggregator — no table density, no competing CTAs, no visual chaos. The design earns trust through restraint and precision.

**Key Characteristics:**
- Tonal dark with cold blue-gray neutrals — no warm blacks
- One accent color (Signal indigo) used at strict ≤10% surface coverage
- System font stack — no web font load, no layout shift
- Tight tracking on headings; loose leading on body
- Components are flat at rest, responsive to interaction only
- AEL/intelligence layer uses a distinct violet sub-palette to signal automation

## 2. Colors: The Workbench Palette

A restrained dark palette with cold neutrals and a single precise accent. The Signal color is used sparingly — its rarity is what makes it work.

### Primary
- **Signal** (`#4f46e5` / indigo-600): The sole interactive accent. Used on primary CTAs, active states, score bars, and selection highlights. If Signal appears more than once per screen section, one of those uses is wrong.
- **Signal Active** (`#6366f1` / indigo-500): Hover and focus state for Signal elements only. Never used at rest.

### Secondary
- **Analysis Violet** (`#8b5cf6` / violet-500): Exclusive to the AEL intelligence layer — auto-generated page badges, GEO scores, confidence indicators. Signals "this was produced by the system." Never used for navigation, CTAs, or editorial content.

### Neutral
- **Workbench Deep** (`#030712` / gray-950): The primary surface. All page backgrounds.
- **Instrument Surface** (`#111827` / gray-900): Cards, panels, raised containers. One step lighter than the base.
- **Boundary Line** (`#1f2937` / gray-800): All borders and dividers. The structural skeleton of every layout.
- **Mid-Tone** (`#374151` / gray-700): Deeply muted elements — disabled states, inactive step indicators.
- **Annotation** (`#6b7280` / gray-500): Metadata, timestamps, secondary labels, placeholder text. The voice of the system, not of the content.
- **Reading Text** (`#d1d5db` / gray-300): Body copy. All prose content on dark backgrounds.
- **Output Text** (`#ffffff` / white): Headings, rankings, results, product names. What the user came to read.

### Named Rules
**The Signal Scarcity Rule.** Signal indigo covers ≤10% of any given screen. Its rarity is the point. If it appears more than once in a visible viewport, the layout has lost its hierarchy.

**The Violet Firewall Rule.** Analysis Violet is reserved exclusively for the AEL intelligence layer. It must never appear on navigation, editorial content, or CTAs. Its presence signals "machine output" — diluting that signal corrupts the information architecture.

## 3. Typography

**Display / Body Font:** -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif

No web font is loaded. The system font stack renders instantly with zero layout shift, consistent with the workbench aesthetic — no performance theater, no typographic ego.

**Character:** Functional and direct. The font does not have a personality; the content does. Hierarchy is enforced through weight contrast (400 body / 700 display) and tracking (tight on headings, normal on body), not through decorative faces.

### Hierarchy
- **Display** (700 weight, 30px, line-height 1.2, tracking -0.025em): Page titles and H1s. The ranking page headline. The question in the quiz. One per page.
- **Headline** (700 weight, 24px, line-height 1.3, tracking -0.02em): Section headings, quiz question subtitles. Used when a second significant heading is needed.
- **Title** (600 weight, 18px, line-height 1.4): Card headings, product names in results. The workhorse heading level.
- **Body** (400 weight, 14px, line-height 1.6): All prose, descriptions, reasoning text. Max line length 65–75ch. Reading Text color (`#d1d5db`) on all dark surfaces.
- **Label** (700 weight, 11px, line-height 1.4, tracking 0.1em, all-caps): Section identifiers, category tags, metadata. "DECISION INTELLIGENCE · LAPTOPS". Annotation color (`#6b7280`).

### Named Rules
**The Weight-Only Emphasis Rule.** Emphasis is conveyed through font weight (400 → 600 → 700) and color step changes (Annotation → Reading Text → Output Text). Italic, underline, and color highlights are prohibited in editorial content.

## 4. Elevation

DEN uses tonal layering, not shadows. Depth is expressed by stepping through the neutral palette: Workbench Deep (base) → Instrument Surface (raised content) → Boundary Line (defined edges). This reads as structured and deliberate on dark backgrounds where shadows disappear anyway.

Shadows appear only as a response to state, never at rest. The single exception is the primary CTA button, which carries a diffuse indigo glow (`shadow-lg shadow-indigo-900/30`) to reinforce its position as the primary action target.

### Shadow Vocabulary
- **Signal Glow** (`0 10px 15px -3px rgb(49 46 129 / 0.3)`): Primary CTA button only. Reinforces the Signal accent. Not reused elsewhere.
- **Ambient Glow** (`0 0 60px 20px rgb(99 102 241 / 0.06)`): Hero section or score display accent only. Extremely subtle; invisible unless the surface is otherwise empty.

### Named Rules
**The Flat-By-Default Rule.** Every surface is flat at rest. Shadows appear only as interactive state feedback (hover, focus) or as a single structural marker (primary CTA). If a card has a shadow at rest, remove it.

## 5. Components

### Buttons
Precise shape, confident color assignment. They don't beg for clicks — they're simply unmistakable when needed.

- **Shape:** Gently rounded (12px radius / `rounded-xl`). Not pill, not square.
- **Primary:** Signal indigo background (`#4f46e5`), Output Text (`#ffffff`), 14px font-semibold, 14px/32px padding. Signal Glow on hover. Translates to `bg-indigo-600 hover:bg-indigo-500`.
- **Hover / Focus:** Signal Active background (`#6366f1`). No scale transform. Focus ring: Signal border (`#3730a3`) at 2px offset.
- **Ghost / Secondary:** No background. Boundary Line border. Reading Text. On hover: Instrument Surface background. Used for back navigation and low-priority actions only.

### Chips and Badges
- **Category badge:** Rounded-full, Output Text on Signal (primary navigation, selected state).
- **Intelligence badge (AEL):** Analysis Depth background (`#2e1065`), Analysis Violet text (`#8b5cf6`), Analysis Border border (`#5b21b6`). Rounded-full. 10px font-bold uppercase tracked. Used only for machine-generated content signals.
- **Segment badge:** Category-specific tints (emerald for student, red for gamer, blue for professional, violet for creator). Same shape as intelligence badge.

### Cards
Content recedes into the surface; the workbench shows its contents without framing everything.

- **Corner Style:** 12px radius (`rounded-xl`)
- **Background:** Instrument Surface (`#111827`)
- **Border:** Boundary Line (`#1f2937`) at 1px. On hover: Signal Border (`#3730a3`) at 50% opacity.
- **Hover Treatment:** `-translate-y-0.5` (2px lift) with border shift. Duration 150ms ease-out.
- **Internal Padding:** 14px vertical / 16px horizontal (`px-4 py-3.5`).
- **No shadows at rest.** Flat-By-Default Rule applies.

### Score Bars (Signature Component)
DEN's most distinctive UI element — the ranked score visualization.

- **Track:** Boundary Line (`#1f2937`), 8px height, rounded-full.
- **Fill:** Signal indigo (`#4f46e5`), same shape. Width set by score percentage.
- **Animation:** Clip-path reveal left-to-right, 1.2s cubic-bezier(0.16, 1, 0.3, 1), 400ms delay. Reveals on page load. No replay on interaction.
- **Label:** 11px bold uppercase tracking-widest (Label style). Annotation color for dimension name; Output Text for score value.

### Navigation
- **Style:** Sticky, `backdrop-blur-sm`, Workbench Deep at 80% opacity (`bg-gray-950/80`), Boundary Line border-bottom at 40% opacity.
- **Logo mark:** 24px square, Signal indigo background, bold "D" in Output Text. Rounded-md (8px).
- **Category links:** Body size (14px), Annotation color at rest, Reading Text on hover. 150ms transition.
- **No active state underlines.** Position is communicated by page heading, not nav highlight.

### Inputs / Fields
- **Style:** Instrument Surface background, Boundary Line border (1px), 8px radius (`rounded-lg`).
- **Focus:** Signal Border (`#3730a3`) at 2px, no glow.
- **Placeholder:** Annotation color (`#6b7280`).

## 6. Do's and Don'ts

### Do:
- **Do** use tonal layering (Workbench Deep → Instrument Surface → Boundary Line) to convey depth. Never introduce shadows at rest.
- **Do** cap Signal indigo to ≤10% of any given screen surface. Its scarcity is its authority.
- **Do** use Output Text (`#ffffff`) for headings and ranked results only. Body copy stays at Reading Text (`#d1d5db`).
- **Do** use font-weight contrast (400/600/700) for typographic hierarchy. No italics, no color highlights in editorial content.
- **Do** keep the Analysis Violet palette exclusively for machine-generated / AEL content. The user must be able to distinguish editorial from automated at a glance.
- **Do** respect `prefers-reduced-motion` — wrap all clip-path and transform animations in a `@media (prefers-reduced-motion: no-preference)` guard.
- **Do** keep body line length at 65–75ch maximum. Wider columns degrade readability and make pages feel like generated content.
- **Do** give interactive elements (cards, buttons) a clear hover state. Flat at rest, responsive to touch.

### Don't:
- **Don't** build autopilot SEO content. Thin editorial, affiliate-first structure, AI boilerplate voice — this is the anti-reference. If a page can't take a clear stance on its recommendation, it shouldn't exist.
- **Don't** use gradient text (`background-clip: text` with any gradient). Ever. It is a direct marker of the generic AI/SaaS aesthetic DEN explicitly rejects.
- **Don't** use glassmorphism (backdrop-filter blur) as decoration. The navbar blur is structural (it hides content scrolling beneath it). Any other blur usage requires explicit justification.
- **Don't** build price comparison aggregator layouts — dense tables, competing CTAs, ad-driven visual hierarchy. DEN is editorial, not transactional.
- **Don't** use warm blacks or warm grays. All neutrals must have a cold blue-gray tint (the Tailwind gray scale is correct; don't substitute zinc, slate-warm, or neutral).
- **Don't** add shadows to cards at rest. Cards are flat. Hover states can lift; rest states cannot.
- **Don't** use Analysis Violet for navigation, CTAs, or any user-initiated action. It signals machine output — misuse corrupts the intelligence signal.
- **Don't** animate layout properties (height, width, top, left, padding). Animate opacity and transform only.
- **Don't** use side-stripe borders (border-left or border-right greater than 1px as a colored accent). Use background tints, full borders, or leading icons instead.
- **Don't** repeat the page title or section heading as the first sentence of body copy. Every word earns its place or it's cut.
