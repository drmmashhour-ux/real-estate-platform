# LECIPM brand assets

Premium logo system: **one brand gold** (`#D4AF37`, same as `--color-premium-gold` / `text-brand-gold` in the web app), black (`#000000`), white (`#FFFFFF`). Wordmark and tagline use this gold only (no multi-stop gradients).

| File | Use |
|------|-----|
| `lecipm-full-on-dark.svg` | Full lockup on **dark** backgrounds (navbar context, hero, decks). |
| `lecipm-full-on-light.svg` | Full lockup on **light** backgrounds (print, light UI). |
| `lecipm-mark-on-dark.svg` | Icon only on dark (favicon source, app icon, nav mark). |
| `lecipm-mark-on-light.svg` | Icon only on light. |
| `*-*.png` | Raster exports (transparent), generated via `pnpm brand:export` from `apps/web`. |

**Regenerate PNGs:** `pnpm brand:export` (runs `scripts/export-brand-logos.cjs`).

Full lockup: **LECIPM** with subtitle **Le Carrefour Immobilier Prestige** (no en-dash between the two).
