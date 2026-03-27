# BNHub pitch deck — luxury design system

**Purpose:** Investor-grade, **black + gold** visual language for **BNHub** (and BNHub + LECIPM decks). **Luxury = restraint** — space, contrast, few elements.

**Apply to:** [pitch-deck-slides.md](pitch-deck-slides.md) (copy-paste bullets) · [pitch-deck.md](pitch-deck.md) (layout notes) · Google Slides · PowerPoint · Keynote.

---

## 1. Color system (mandatory)

| Token | Hex | Use |
|-------|-----|-----|
| **Primary background** | `#0B0B0B` | Slide canvas, full-bleed backgrounds |
| **Primary accent** | `#D4AF37` | Headline accents, key numbers, icons, rules, chart highlights |
| **Secondary surface** | `#1A1A1A` | Cards, callouts, chart plot area, secondary panels |
| **Accent soft** | `#E6C76E` | Hover states, secondary highlights, gradient stops (use sparingly) |
| **Text primary** | `#FFFFFF` | Titles, primary labels, chart axes (major) |
| **Text muted** | `#BFBFBF` | Body copy, captions, footnotes, secondary chart labels |

**Rules**

- **Never** place gold body text on gold — keep gold for **emphasis**, not paragraphs.
- **Contrast:** White and gold on `#0B0B0B` meet strong readability; muted gray only for **supporting** text, not critical numbers.
- **Maximum “accent colors” on one slide:** Gold + one use of light gold **or** white — avoid rainbow charts; use **grayscale data** with **gold** for the single insight.

---

## 2. Typography

**Font stack (choose one family for the whole deck)**

- **Titles:** Modern geometric or neo-grotesk sans — e.g. **Inter**, **SF Pro**, **Helvetica Neue**, **Manrope**, **Plus Jakarta Sans** (Bold / SemiBold, **not** condensed).
- **Body:** Same family, **Regular / Medium** — never mix a second sans unless for **logotype** only.

**Hierarchy**

| Role | Weight | Size (16:9, 1920×1080 ref.) | Tracking |
|------|--------|----------------------------|----------|
| **Slide title** | Bold | 44–56 pt | Tight (-1% to -2%) |
| **Subtitle / kicker** | Medium | 18–22 pt | Normal |
| **Body / bullets** | Regular | 16–20 pt | Normal |
| **Caption / legal** | Regular | 12–14 pt | Normal; **#BFBFBF** |

**Title treatment (luxury)**

- Default: **White** title, optional **thin gold rule** or **single word** in gold (e.g. “Trust” in the problem headline).
- Avoid all-caps paragraphs; **sentence case** or **title case** reads more premium than shouting.

---

## 3. Spacing & grid

- **Margins:** Minimum **8%** of slide width on left/right; **7–10%** top/bottom — never crowd the edge.
- **Vertical rhythm:** Base unit **8 px** (or 10 pt in slide tools). Space between title and first bullet: **24–40 pt**.
- **Bullets:** **6–12 pt** between lines; **16–24 pt** after each bullet block before a footer note.
- **Max bullets per slide:** **4** ideal; **5** hard stop — split slides instead of shrinking type.

**Alignment**

- **Title slides:** Center axis for logo, title, tagline.
- **Content slides:** Left-align text block; **one** visual anchor right (or full-bleed image with left gradient scrim for text).

---

## 4. Slide layout system

| Layout | Code | When to use |
|--------|------|-------------|
| **A — Title** | `A` | Opening, section breaks, thank-you |
| **B — Content** | `B` | Problem, solution, model, GTM — narrative + one visual |
| **C — Highlight** | `C` | One-line thesis, transition, vision punch |
| **D — Data** | `D` | Market, traction metrics, financials, competitive matrix |

**B — Content (left text / right visual)**

- Left **40%** text, right **60%** visual **or** 45/55.
- Text block: title top-aligned with **top** of visual, not vertically centered with a tall image (avoids awkward gap).

**C — Highlight**

- Single statement, **2 lines max**; optional small subline in **#BFBFBF**.
- Lots of **negative space**; gold **hairline** above or below text optional.

**D — Data**

- One **primary** chart or table; title states the **insight**, not “Chart.”
- Gold for **one series** or **one bar** — the takeaway.

---

## 5. Visual style rules

**Do**

- **Generous** padding; **one** focal point per slide.
- **Strong** black + **precise** gold accents (rules, dots, numbers).
- Optional **subtle** vertical gradient: `#0B0B0B` → `#141414` (5–8% lightness shift only).
- **1 px** gold or **#333** hairline dividers between sections.

**Don’t**

- Stock photos of handshakes / generic city skylines unless **heavily** darkened and cropped with **single** focal point.
- Busy patterns, neon, or third “brand” colors competing with gold.
- Drop shadows on **text**; **very soft** shadow on **device mockups** only (see below).

---

## 6. Icons & graphics

- **Style:** Thin stroke (**1–1.5 pt** at deck resolution), **rounded** or **sharp** consistently — pick one.
- **Color:** **Gold** `#D4AF37` on black, or **white** on `#1A1A1A` cards.
- **Diagrams:** 3–5 nodes max; **straight** connectors; labels in **white** or **muted**.
- **Charts:** Dark background `#0B0B0B` or plot in `#1A1A1A`; gridlines **#2A2A2A**; **gold** for the metric you’re selling.

---

## 7. Background options

| Option | Spec |
|--------|------|
| **Pure black** | `#0B0B0B` full bleed — default, safest |
| **Subtle gradient** | Linear top-to-bottom: `#0B0B0B` → `#121212` or corner vignette **5–10%** darker at edges |
| **Minimal texture** | **≤ 3%** opacity noise or grain; **no** visible pattern at normal viewing distance |

**Footer (optional, repeated)**

- **#BFBFBF** 11–12 pt: “Confidential · [Company] · [Date]” — single line, bottom margin.

---

## 8. Components (reusable)

**Section divider (between sections in long decks)**

- Full-width **1 px** line `#D4AF37` at **20% opacity**, or **centered** short rule **120 pt** wide, gold, between title and body.

**Bullets**

- **Gold dot** (6–8 pt circle) or **short gold dash** (12 pt × 2 pt) — **not** both in one deck.
- Text starts **aligned**; first line matches subsequent lines (hanging indent).

**Callout box**

- Fill: `#1A1A1A`  
- Border: **1 px** `#D4AF37` (full opacity) or **#D4AF37** at **40%** for quieter notes  
- Inner padding: **20–24 pt**  
- Title inside box: **white** SemiBold; body: **#BFBFBF**

**Key number**

- **Gold** `#D4AF37`, **Bold**, **36–48 pt** for hero stat; label above in **#BFBFBF** **14 pt**.

**Device / UI mockup**

- **Rounded rectangle** frame **#1A1A1A**; screen content real product screenshot.  
- Shadow: `0 24px 80px rgba(0,0,0,0.45)` — single layer, **no** colored glow.

---

## 9. Transitions (optional)

- **Fade** 0.3–0.5 s between slides, or **none** (very acceptable for investors).
- **Push/slide** subtle, same direction all deck — **avoid** spins, bounces, builds on every bullet.

**Animation discipline**

- If animating: **one** entrance per slide (e.g. chart bars); **no** stagger on every line.

---

## 10. Export & production

**Google Slides / PowerPoint**

- Set **slide size** 16:9 (**1920 × 1080** or **13.333 × 7.5 in**).
- **Master slides:** Black background, placeholder title (white), body (muted default), gold accent shape library.
- **Embed fonts** on export (PDF) where possible.

**PDF for email**

- Export **PDF**; check **gold** doesn’t clip — print preview once.

**Consistency checklist**

- [ ] All backgrounds `#0B0B0B` (or approved gradient).  
- [ ] Gold only from **#D4AF37** / **#E6C76E** palette.  
- [ ] No more than **4** bullets on any slide.  
- [ ] One **visual hero** per content slide.  
- [ ] Financial slides: **ESTIMATES** disclaimer in **caption** style.

---

## 11. BNHub + LECIPM identity note

- **Primary deck accent:** Gold = **BNHub** premium signal; LECIPM can be referenced in **white** with a **small gold rule** under combined logo lockup if both marks appear.
- **Tagline** on title slide: **muted** gray, **single** line — keeps focus on **wordmark + gold**.

---

**Summary:** **Black** canvas, **white** clarity, **gold** only where the eye should **invest**. That reads as **luxury tech**, not **template**.
