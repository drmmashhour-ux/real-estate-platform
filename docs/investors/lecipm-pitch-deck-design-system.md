# LECIPM — Investor pitch deck design system

## Pixel-perfect sources (canonical)

| Asset | Purpose |
|-------|---------|
| `pitch-deck/lecipm-pitch-deck-1920.html` | **1920 × 1080 px** slides in the browser — print to **PDF** (margins none, background on) |
| `pitch-deck/LECIPM_Investor_Deck.pptx` | **PowerPoint** 16:9 — regenerate with `python docs/investors/pitch-deck/build_lecipm_investor_deck.py` |
| `pitch-deck/build_lecipm_investor_deck.py` | Builder script (`pip install -r docs/investors/pitch-deck/requirements.txt`) |

**Canvas:** 16:9 · **1920 × 1080 px** · margin **80 px** · section spacing **40 px** · body line height **1.3–1.5**.

**Canva:** There is no native `.canva` export from this repo. Create a **1920 × 1080** presentation, set brand colors below, apply **Montserrat** / **Open Sans**, then either paste from `lecipm-pitch-deck-slides-content.md` or **upload PDF pages** exported from the HTML above as locked backgrounds and rebuild text layers for editability.

Legacy reference: `pitch-deck/lecipm-investor-deck.html` (fluid layout, no fixed canvas).

---

## Brand tokens

| Token | Hex | Usage |
|-------|-----|--------|
| Background | `#000000` | Full slide background |
| Primary gold | `#D4AF37` | Rules, icons, highlights, KPI numerals |
| Secondary gold (accent) | `#C9A646` | Labels, arrows, secondary emphasis |
| Text primary | `#FFFFFF` | Headlines, bullets |
| Subtext | `#BFBFBF` | Subtitles, captions, supporting lines |
| Gold gradient (subtle) | optional top-right radial `rgba(212,175,55,0.06–0.08)` | HTML deck only |

**Style:** Premium · minimal · high-end real estate — generous whitespace, no clutter.

---

## Typography

| Role | Font | Weight | Size (1920×1080) |
|------|------|--------|------------------|
| Slide title | **Montserrat** | 700 (Bold) | **48–64 px** (title slide hero **60 px**) |
| Subtitle | **Montserrat** | 600 (SemiBold) | **28–36 px** |
| Body / bullets | **Open Sans** | 400 (Regular) | **20–24 px** |
| KPI / big number | Montserrat | 700 | **60 px** (traction slide) |
| Section label | Montserrat | 600 | ~14 px, uppercase, gold accent |

**Load fonts (web / Google Slides / Canva):** Montserrat Bold, Open Sans Regular/SemiBold.

---

## Slide templates

### 1. Title slide

- Centered vertically and horizontally  
- Large title (Montserrat bold, white)  
- Subtitle Open Sans, `#B3B3B3` or white at 85% opacity  
- **Gold horizontal rule** 120–180 px wide, 2–3 px height, centered under title  
- Optional: thin gold frame inset 48 px from edges  

### 2. Section divider (optional between acts)

- Left: gold uppercase label + white section title  
- Right: abstract geometric or single icon cluster (gold line art)  

### 3. Content slides (Problem, Solution, etc.)

- **Max 4–5 bullets**  
- Left column 55%: title + bullets  
- Right 45%: icon stack or simple illustration  
- Each bullet: **gold icon** (24–32 px) + white text; 16–24 px gap  

**Icon semantics (gold #D4AF37 on transparent or dark circle stroke):**

- AI → sparkles / brain / chip  
- Analytics → chart / pulse  
- Security → shield / lock  
- Growth → trending-up / arrow  

### 4. Data / traction slides

- **One hero number** per idea (or 2–3 max on one slide)  
- Number in gold or white at very large size  
- One line caption below in `#B3B3B3`  

---

## Diagram slides

### Product (system overview)

Suggested layout: **horizontal swimlane** or **five connected nodes**:

`Lead Funnel → Deal Intelligence → Broker Assistant → Compliance Layer → Learning / Marketplace signals`

Use gold connecting lines (#D4AF37 at 60% opacity), white labels inside dark `#111` rounded cards.

### How it works (canonical flow)

**Centris → LECIPM → AI → Broker → Closed Deal**

- Arrow style: thin gold arrow or chevron between nodes  
- Node pills: `#1a1a1a` fill, 1 px gold border  

---

## Export workflows

### PDF (fastest)

1. Open `pitch-deck/lecipm-investor-deck.html` in **Chrome**.  
2. **Print → Save as PDF** · Margins: None · Background graphics: **On**.  
3. Paper: **Landscape** optional; HTML is viewport-based — use **Full screen** (`Cmd+Shift+F`) before print if needed.

### PowerPoint

1. **Design → Slide Size:** Widescreen 16:9 · Background: solid black `#000000`.  
2. Set **theme fonts:** Headings = Montserrat, Body = Open Sans.  
3. Paste content from `lecipm-pitch-deck-slides-content.md`.  
4. Insert **shapes** for gold rule; **Icon** (Office icons) colored `#D4AF37`.  
5. For diagrams: **SmartArt → Process** or duplicate layout from HTML screenshot.

### Canva

1. Create **Presentation** · 1920 × 1080 px.  
2. Set background `#000000` · add **Brand kit** colors: Gold `#D4AF37`, White `#FFFFFF`.  
3. Apply fonts **Montserrat** (titles) · **Open Sans** (body).  
4. Use **Elements → Lines & Shapes** for gold rules; search “minimal real estate” for restrained accents.  
5. Copy bullets from slide content doc; replace icons with gold **stroke** icons from Canva library.

---

## File map

| File | Purpose |
|------|---------|
| `lecipm-pitch-deck-design-system.md` | This specification |
| `lecipm-pitch-deck-slides-content.md` | Copy for all 12 slides |
| `pitch-deck/lecipm-pitch-deck-1920.html` | Fixed **1920×1080** layout · PDF export |
| `pitch-deck/LECIPM_Investor_Deck.pptx` | Generated PowerPoint deck |
| `pitch-deck/build_lecipm_investor_deck.py` | Regenerate `.pptx` |
| `pitch-deck/lecipm-investor-deck.html` | Legacy fluid HTML |

---

*LECIPM wordmark: use approved logo asset from brand folder when available; fallback to Montserrat Bold “LECIPM” in white with gold subtitle rule.*
