# LECIPM — Design System + Product UI

**Figma file name (create in Figma):** `LECIPM — Design System + Product UI`

This document mirrors the **page → frame → component** structure to build in Figma for **design → dev handoff**. It pairs with:

- `docs/design/lecipm-design-tokens.w3c.json` — token import (Tokens Studio / W3C-compatible tools)
- Live UI reference: `apps/web` routes under `/design/lecipm-dashboard` (see § Dev parity)

---

## Global setup (once per file)

1. **Color variables** (or Color styles): map to token keys in § Colors.
2. **Text styles**: map to § Typography (use exact px for desktop baseline).
3. **Number variables** (spacing): `space/8`, `space/16`, … per § Spacing.
4. **Layout grids** on product frames:
   - **12-column grid**, width = frame width − sidebar (when sidebar is separate), **gutter 24**, **margin 80** on main content area (matches dev mock padding).
   - Sidebar frames: fixed width **240px** (spec); dev mock uses 260px — align Figma → dev in handoff notes if you change.
5. **Auto layout**: default direction **vertical** for pages; **horizontal** for KPI rows, split panels, tab bars. Use **Fill container** + **Hug contents** intentionally; set **min/max** where needed for responsive intent.

**Naming convention (layers & components):**

| Pattern | Example |
|---------|---------|
| Components | `component/{type}/{variant}/{state}` |
| Layout shells | `layout/{surface}/{region}` |
| Frames | `frame/{feature}/{screen}` |
| Pitch | `pitch/slide/{nn}-{slug}` |

Examples:

- `component/button/primary/default`
- `component/button/primary/hover`
- `component/card/default`
- `layout/dashboard/sidebar`
- `layout/dashboard/main`
- `frame/dashboard/main`

---

## Page 1 — Design System

**Figma page title:** `1 · Design System`

### COLORS (styles / variables)

| Token name | Hex | Usage |
|------------|-----|--------|
| `color/background/black` | `#000000` | App background, pitch background |
| `color/brand/gold-primary` | `#D4AF37` | Primary actions, key accents |
| `color/brand/gold-secondary` | `#C9A646` | Secondary gold, labels, arrows |
| `color/text/primary` | `#FFFFFF` | Headings, primary body |
| `color/text/muted` | `#BFBFBF` | Secondary text, captions |
| `color/surface/card` | `#111111` | Card fill (align with dev `ds-card`) |
| `color/surface/elevated` | `#1A1A1A` | Inputs, nested surfaces |
| `color/border/default` | `#2A2A2A` | Card / panel borders |

### TYPOGRAPHY (text styles)

| Style name | Size | Weight | Line height | Letter-spacing |
|------------|------|--------|-------------|----------------|
| `text/h1` | 64px | Bold (700) | 1.15 | tight |
| `text/h2` | 40px | SemiBold (600) | 1.2 | tight |
| `text/h3` | 28px | SemiBold (600) | 1.25 | — |
| `text/body` | 20px | Regular (400) | 1.45 | — |
| `text/caption` | 16px | Regular (400) | 1.4 | optional +0.01em |

**Font family:** Headings **Montserrat** (or agreed alternative); body **Open Sans**.

### SPACING SCALE (number variables)

| Token | px |
|-------|-----|
| `space/8` | 8 |
| `space/16` | 16 |
| `space/24` | 24 |
| `space/32` | 32 |
| `space/40` | 40 |
| `space/64` | 64 |

Use **multiples** of 8 for any extra spacing to stay aligned with dev Tailwind scale.

### Optional: effects

| Token | Value |
|-------|--------|
| `shadow/card` | `0 10px 40px rgba(0,0,0,0.45)` |
| `shadow/glow-gold` | `0 0 40px rgba(212,175,55,0.12)` |

---

## Page 2 — Components

**Figma page title:** `2 · Components`

Build as **Figma components** with **variants** where noted. Each variant group: **state** = default | hover | active | disabled.

| Component set | Variant axes | Notes |
|---------------|--------------|--------|
| `component/button/primary` | state | Gold fill, dark text |
| `component/button/secondary` | state | Outline gold / dark fill |
| `component/card/default` | — | Radius 12px, border + soft shadow |
| `component/badge/insured-broker` | — | Gold border tint |
| `component/badge/ai-optimized` | — | Muted / neutral |
| `component/input/default` | state | Height min 44px touch |
| `component/input/textarea` | state | Listing description |
| `component/tabs/item` | state selected | Gold underline variant |
| `component/sidebar/item` | state active | Gold inset / border |
| `component/kpi/card` | — | Label + large value |
| `component/alert/default` | severity: warning · error · success | Compliance / listing warnings |

**Hover:** increase shadow toward `shadow/glow-gold`; border `color/brand/gold-primary` @ ~35% opacity.

---

## Page 3 — Dashboard UI

**Figma page title:** `3 · Dashboard UI`

### Shell frame

| Frame | Size | Notes |
|-------|------|--------|
| `frame/dashboard/main` | **1440 × 900** (baseline) | Alternative **1920 × 1080** for marketing parity |

**Structure (auto layout, horizontal):**

1. `layout/dashboard/sidebar` — **Fixed width 240px**, vertical stack, fill height.
2. `layout/dashboard/main` — **Fill container**, vertical stack:
   - `layout/dashboard/topbar` — height **56–64px**, minimal.
   - `layout/dashboard/content` — padding **80** (token), vertical stack, **width hug / fill**.

### Content frames (place inside `layout/dashboard/content`)

| Frame ID | Contents |
|----------|-----------|
| `frame/dashboard/kpi-row` | Auto layout horizontal, gap `space/24`; four `component/kpi/card` |
| `frame/dashboard/deal-intelligence` | Card: **dealScore**, **closeProbability**, **riskLevel** |
| `frame/dashboard/ai-suggestions` | Two suggestion rows: “Follow up now”, “Adjust price” |

**Grid:** Apply **12-column** layout only to `layout/dashboard/content` (sidebar excluded). KPI row can span **3 cols × 4** at desktop.

---

## Page 4 — Listing Assistant

**Figma page title:** `4 · Listing Assistant`

| Frame | Description |
|-------|-------------|
| `frame/listing-assistant/page` | Full shell + tabs |

**Tabs (variant group):** Content · Compliance · Pricing · SEO · Export  

**Sections (one frame each, vertical stack):**

| Section frame | Contents |
|---------------|----------|
| `frame/listing-assistant/content` | Title generator, description, highlights |
| `frame/listing-assistant/compliance` | Risk level, warnings list |
| `frame/listing-assistant/pricing` | Suggested price, competitiveness score |
| `frame/listing-assistant/seo` | Keywords, meta description |
| `frame/listing-assistant/export` | JSON · Copy text · Export for Centris |

Use **Tabs component** to show/hide sections (prototype) or **separate frames per tab** for static handoff — prefer **component/tabs/item** + shared content blocks.

---

## Page 5 — Deal Engine

**Figma page title:** `5 · Deal Engine`

| Frame | Width behavior |
|-------|----------------|
| `frame/deals/list` | Left column **340px** fixed (or 320–360), vertical list |
| `frame/deals/detail` | Fill; contains score, probability, timeline, next action |

**Detail elements:**

- `component/metric/deal-score`
- `component/metric/probability`
- `layout/deals/timeline` (strip or vertical steps)
- `layout/deals/next-action` (callout + primary button)

---

## Page 6 — Compliance

**Figma page title:** `6 · Compliance`

| Frame | Contents |
|-------|----------|
| `frame/compliance/score-card` | Large score |
| `frame/compliance/risk` | Risk indicator |
| `frame/compliance/events` | Scrollable list — warnings / violations |

---

## Page 7 — Investment

**Figma page title:** `7 · Investment`

| Frame | Contents |
|-------|----------|
| `frame/investment/opportunities` | Opportunity cards grid |
| `frame/investment/roi` | ROI % hero |
| `frame/investment/ranking` | Ordered list |

---

## Page 8 — Investor Pitch

**Figma page title:** `8 · Investor Pitch`

**Frame size (all):** **1920 × 1080**

Create **12 frames** with shared **pitch/layout/master** auto layout (margins **80**, title left or centered per slide type).

| Frame name | Slide |
|------------|--------|
| `pitch/slide/01-title` | Title |
| `pitch/slide/02-problem` | Problem |
| `pitch/slide/03-market-gap` | Market gap |
| `pitch/slide/04-solution` | Solution |
| `pitch/slide/05-product` | Product overview diagram |
| `pitch/slide/06-how-it-works` | How it works flow |
| `pitch/slide/07-differentiation` | Differentiation |
| `pitch/slide/08-business-model` | Business model |
| `pitch/slide/09-traction` | Traction |
| `pitch/slide/10-moat` | Moat |
| `pitch/slide/11-vision` | Vision |
| `pitch/slide/12-ask` | Ask |

**Reusable blocks:**

- `pitch/block/title-hero`
- `pitch/block/section-heading`
- `pitch/block/bullet-row`
- `pitch/block/kpi-large`
- `pitch/block/flow-node`
- `pitch/block/footer-confidential`

Copy source of truth: `docs/investors/lecipm-pitch-deck-slides-content.md` and HTML reference `docs/investors/pitch-deck/lecipm-pitch-deck-1920.html`.

---

## Auto layout & handoff checklist

- [ ] Every frame that mirrors a screen uses **Auto layout**.
- [ ] Components use **variant properties**, not detached copies.
- [ ] Spacing uses **variables** (`space/*`), not magic numbers.
- [ ] Export **Dev Mode** annotations: note sidebar **240px**, content padding **80**, gold **#D4AF37**.
- [ ] Link Dev Mode to Storybook / Next routes when components exist.

---

## Dev parity (implemented references)

| UI area | Route (example) |
|---------|------------------|
| Dashboard shell + pages | `/en/ca/design/lecipm-dashboard` (+ subpaths) |
| Pitch PDF baseline | Open `docs/investors/pitch-deck/lecipm-pitch-deck-1920.html` → Print PDF |

These are **presentation mocks** (`robots: noindex`). Production dashboards live under authenticated routes separately.

---

## What this repo cannot generate

- A binary **`.fig`** file must be created in **Figma** (blank file → rename → apply this structure).
- Use **`lecipm-design-tokens.w3c.json`** with **Tokens Studio for Figma** (or paste variables manually from Page 1 tables).
