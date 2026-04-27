# LECIPM — Figma product UI (orders 01–06)

**Purpose:** Ready-to-build frames for **in-app** UI: landing, listings, booking, dashboards, demo. Aligns with the black + gold system; use for Figma and handoff to engineering.

**Related:** [investor/pitch-deck-figma-spec.md](../investor/pitch-deck-figma-spec.md) (1920×1080 pitch), [design-system.md](../design-system.md) (BNHub deck — different context).

---

## 01 — Foundations

### Colors

| Token   | Hex       |
|--------|-----------|
| Black  | `#000000` |
| Dark   | `#111111` |
| Gold   | `#D4AF37` |
| White  | `#FFFFFF` |
| Muted  | `#A3A3A3` |
| Success| `#22C55E` |
| Error  | `#EF4444` |

### Typography

- **Font:** Inter  
- **Headline:** 64 / Bold  
- **Section title:** 36 / SemiBold  
- **Body:** 18 / Regular  
- **Small:** 14 / Muted (`#A3A3A3` or “muted” style)

### Grid

- **Frame width:** 1920px (reference)  
- **12 columns**  
- **Margin:** 120px  
- **Gutter:** 24px  

---

## 02 — Components (reusable)

**Naming (examples):** `Button/Primary`, `Button/Secondary`, `Card/Default`, `Badge/Success`, `Badge/Medium`, `Badge/Alert`, `Tag/AI`.

| Component  | Spec |
|------------|------|
| **Button — Primary** | Gold background, appropriate contrast for label |
| **Button — Secondary** | Border + white text on dark |
| **Card** | Background `#111`, border `1px solid #222`, radius `16px` |
| **Badge — Green** | Success (`#22C55E` semantic) |
| **Badge — Yellow** | Medium / warning |
| **Badge — Red** | Alert / error |
| **AI tag** | Small pill copy examples: `AI Insight`, `High Demand` |

**Auto layout:** use for all components; set consistent padding and hug/fill as needed.

---

## 03 — Landing

**Frame:** `Landing` / `Home`

**Layout (top to bottom):**

1. **Launch banner** (optional strip)
2. **Hero**  
   - **Headline:** “Real estate, optimized by AI”  
   - **Sub:** pricing + growth + conversion automated  
3. **CTA row**  
   - Primary: “Explore listings”  
   - Secondary: “List your property”  
4. **Trust block**  
   - e.g. “Used by early users”  
   - e.g. “Secure transactions”  

---

## 04 — Listings & booking

### Frame: `Listings` / `Feed`

**Grid of cards (each card):**

- Image (top)  
- Title  
- City  
- Price line: e.g. `$145 / night`  
- Optional: `15+ bookings` (with check)  
- Optional: `High demand` (with flame / emphasis)  

### Frame: `Booking`

**Layout:**

- **Left:** Calendar (blocked vs available dates)  
- **Right (sticky card):** line items + total  

**Example line items:**

- `3 nights × $120`  
- Cleaning: `$30`  
- Service fee: `$36`  
- Taxes: `$18`  
- **TOTAL:** `$444`  
- **Primary CTA:** “Book now”  

### Conflict / error state

- Message: “These dates are already booked.”  
- **Try** alternate ranges as linked suggestions, e.g. `Jun 12 – Jun 15` · `Jun 16 – Jun 19`  

---

## 05 — Dashboard

### Admin — AI Brain

**Frame title area:** e.g. “Marketplace Brain”

**Cards (examples):**

- “Increase prices in Montreal” — Priority: **HIGH**  
- “Launch campaign in Toronto” — Priority: **MEDIUM**  

### Broker — Campaigns

**Example block:**

- **Campaign:** TikTok Ads  
- Impressions: 2,300  
- Clicks: 120  
- Conversions: 9  
- **Recommendation:** e.g. “Improve copy”  

---

## 06 — Demo mode

**Frame:** `Demo` / `Live`

**Steps (vertical or stepped layout):**

1. Search  
2. AI pricing  
3. Trust  
4. Optimization  

**CTA:** `Run live demo` (e.g. play icon + “Run Live Demo”)

Use demo banner / mode indicators per product (see `DEMO_MODE` docs in repo if wiring to the app).

---

## UI effects (important)

- **Hover (interactive elements):** scale **1.02**, **gold** border or glow, **200ms** `ease-in-out`  
- **Cards:** subtle shadow on default; intensify slightly on hover if needed  
- **Transitions:** **200ms** `ease-in-out` for state changes  

---

## Pro Figma setup

- **Auto layout: mandatory** for sections and key blocks  
- **Section padding:** 24–48px (adjust per density)  
- **Component names:** `Category/Variant` (e.g. `Button/Primary`, `Card/Default`, `Badge/Success`)  
- Reuse the **12-col grid** and **Inter** for consistency with foundations  

---

## What this gives you

- **Landing** — hero, CTAs, trust  
- **Listings** — card grid + feed patterns  
- **Booking** — calendar + sticky summary + conflict UX  
- **Dashboard** — admin brain cards + broker campaign analytics  
- **Demo** — guided steps + run CTA  

All aligned with a single **black / dark / gold** language and the **1920pt-wide** grid for designer–dev parity.
