# LECIPM investor pitch deck (HTML + PDF)

## Source of truth

| Asset | Path |
| ----- | ---- |
| **HTML deck** | [`lecipm-investor-deck.html`](./lecipm-investor-deck.html) |
| **Slide copy** (paste into Canva/PPT) | [`../lecipm-pitch-deck-slides-content.md`](../lecipm-pitch-deck-slides-content.md) |
| **Design system** | [`../lecipm-pitch-deck-design-system.md`](../lecipm-pitch-deck-design-system.md) |

Do not duplicate narrative in multiple formats as the canonical source — update the HTML (and/or the markdown slide copy), then re-export PDF.

## Export PDF (one command)

From the **repository root**:

```bash
pnpm install
pnpm run export:investor-deck
```

This runs Puppeteer (`export-deck-to-pdf.mjs`), opens the HTML deck via `file://`, waits for fonts/layout, and writes:

**`docs/investors/pitch-deck/lecipm-investor-deck.pdf`**

Settings used: `printBackground: true`, `preferCSSPageSize: true`, landscape, minimal margins so the black background and gold accents match the on-screen deck.

### Placeholders before investor sends

Search the HTML for:

- `[#]` (traction KPIs)
- `$[___]` (Ask amount)

The export script **warns** when `[#]` or `$[___]` still appear anywhere (including the traction footnote).

**Strict mode** (`--strict`) fails the export only when investor-critical tokens remain:

- `$[___]` anywhere (Ask line), or  
- `[#]` still inside a traction KPI tile (`<div class="num">[#]</div>`)

So you can export with `--strict` after replacing KPI numbers and the Ask amount, even if a footnote still mentions the word `[#]`.

```bash
pnpm run export:investor-deck:strict
# or, from repo root:
node docs/investors/pitch-deck/export-deck-to-pdf.mjs --strict
```

### Updating slides

1. Edit [`lecipm-investor-deck.html`](./lecipm-investor-deck.html) (structure and copy stay aligned with [`lecipm-pitch-deck-slides-content.md`](../lecipm-pitch-deck-slides-content.md)).
2. Replace placeholders as needed.
3. Run `pnpm run export:investor-deck`.

### Troubleshooting

- **Missing HTML**: the script exits with a clear error if `lecipm-investor-deck.html` is absent.
- **Tiny / blank PDF**: the script refuses outputs below a minimum size.
- **Fewer than 10 `.slide` sections**: export aborts (likely broken HTML).
- First run downloads Chromium via Puppeteer; ensure network access for that step.
