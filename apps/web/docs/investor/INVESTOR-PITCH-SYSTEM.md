# LECIPM investor pitch system

Admin-only tooling to generate a **metrics-backed investor narrative**, display it in the UI, and export as Markdown or plain text.

## Modules

| File | Role |
|------|------|
| `modules/investor/pitch.types.ts` | `PitchSection` (title, content, bullets), section ids, `PitchDeckContext`, readiness type |
| `modules/investor/pitch-generator.service.ts` | `loadPitchDeckContextFull()`, `buildPitchDeck()`, `buildPitchDeckFromContext()` — uses `aggregateSnapshotInputs`, `getMarketplaceMetrics`, and lead counts (no changes to billing or transaction rules) |
| `modules/investor/pitch-format.ts` | `formatPitchAsMarkdown`, `formatPitchAsPlainText`, `assessInvestorReadiness` (client-safe) |

## UI

- **Investor home:** `/admin/investor` — embedded `InvestorPitchPanel` with short / standard / long variants.
- **Pitch route:** `/admin/investor/pitch` — same generated panel plus the existing **database-backed** `InvestorPitchViewer` for CMS slides.

## Export

From the panel: **Copy full pitch (Markdown)**, **Download .md**, **Download .txt**.

## Variants

- **Short (~1 min):** tighter copy and fewer bullets.
- **Standard:** default balance.
- **Long (~5 min):** expanded paragraphs and extra bullets where relevant.

Readiness and automated risk hints are **indicative only**; founders should still validate the story with advisors and investors.
