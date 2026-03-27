# Local branding imagery

Folders `montreal/` and `laval/` hold homepage and marketing backgrounds.

Initial JPEGs are sourced from **Unsplash** under the [Unsplash License](https://unsplash.com/license). Replace with your own Montréal / Laval photography for distinct branding.

## Generated PNGs (do not edit by hand)

- **`../icon.png`** — PWA + `apple-touch-icon` (from `branding/logo-icon.svg`).
- **`../logo.png`** — GST/QST and BNHub invoice PDFs (`@react-pdf/renderer` requires raster).
- **`../templates/*.png`** — Canva template card placeholders until you add real previews.

Regenerate after changing the source SVGs:

```bash
pnpm --filter @lecipm/web run assets:generate
```
